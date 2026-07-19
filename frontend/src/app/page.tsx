export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">
        Phase 1 — Project Initialized
      </span>
      <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        Thorax<span className="text-primary">Vision</span>
      </h1>
      <p className="max-w-xl text-center text-muted-foreground">
        AI-assisted Tuberculosis screening from chest X-ray images, powered by
        DenseNet121 with Grad-CAM explainability. Upload, inference, and
        reporting features arrive in upcoming phases.
      </p>
    </main>
  );
}
