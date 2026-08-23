import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { RenderTask } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfSlideViewerProps {
  pdfUrl: string | null;
  pageNumber: number;
  onDocumentLoad?: (pageCount: number) => void;
  onLoadError?: (message: string) => void;
}

export function PdfSlideViewer({
  pdfUrl,
  pageNumber,
  onDocumentLoad,
  onLoadError,
}: PdfSlideViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const renderGenerationRef = useRef(0);
  const [status, setStatus] = useState('等待 PDF…');
  const [loadedPageCount, setLoadedPageCount] = useState(0);

  useEffect(() => {
    if (!pdfUrl) {
      pdfRef.current = null;
      setLoadedPageCount(0);
      setStatus('未配置 PDF');
      return;
    }

    let cancelled = false;
    let loadingTask: pdfjs.PDFDocumentLoadingTask | null = null;

    const load = async () => {
      setStatus('加载 PDF…');
      try {
        loadingTask = pdfjs.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          return;
        }
        pdfRef.current = pdf;
        setLoadedPageCount(pdf.numPages);
        onDocumentLoad?.(pdf.numPages);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'PDF 加载失败';
        setStatus(message);
        onLoadError?.(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
      pdfRef.current = null;
      void loadingTask?.destroy();
    };
  }, [onDocumentLoad, onLoadError, pdfUrl]);

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loadedPageCount === 0) {
      return;
    }

    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const cancelRenderTask = () => {
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };

    const renderPage = async () => {
      const generation = renderGenerationRef.current + 1;
      renderGenerationRef.current = generation;
      cancelRenderTask();

      try {
        const safePage = Math.min(loadedPageCount, Math.max(1, pageNumber));
        const page = await pdf.getPage(safePage);
        if (cancelled || generation !== renderGenerationRef.current) {
          return;
        }

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const styles = getComputedStyle(container);
        const padX =
          parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const padY =
          parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        const statusReserve = 28;
        const availableWidth = Math.max(container.clientWidth - padX, 1);
        const availableHeight = Math.max(
          container.clientHeight - padY - statusReserve,
          1,
        );
        const scale = Math.min(
          availableWidth / baseViewport.width,
          availableHeight / baseViewport.height,
        );
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined;

        const renderTask = page.render({
          canvas,
          viewport,
          transform,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (cancelled || generation !== renderGenerationRef.current) {
          return;
        }

        setStatus(`第 ${safePage} / ${loadedPageCount} 页`);
      } catch (error) {
        if (cancelled || generation !== renderGenerationRef.current) {
          return;
        }
        if (error instanceof Error && error.message.includes('cancelled')) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'PDF 渲染失败';
        setStatus(message);
        onLoadError?.(message);
      } finally {
        if (generation === renderGenerationRef.current) {
          renderTaskRef.current = null;
        }
      }
    };

    void renderPage();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(() => {
            if (resizeTimer) {
              clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(() => {
              void renderPage();
            }, 120);
          })
        : null;
    if (containerRef.current) {
      resizeObserver?.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeObserver?.disconnect();
      cancelRenderTask();
    };
  }, [loadedPageCount, onLoadError, pageNumber]);

  return (
    <div ref={containerRef} className="present-slide-viewer">
      <canvas ref={canvasRef} className="present-slide-canvas" />
      <div className="present-slide-status">{status}</div>
    </div>
  );
}
