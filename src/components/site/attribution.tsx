import Image from "next/image";

export function Attribution() {
  return (
    <div>
      <a
        href="https://henr.ee"
        rel="noopener noreferrer"
        target="_blank"
        className="relative flex w-fit items-center rounded-full bg-gradient-to-b from-neutral-50 to-neutral-100 px-1.5 py-0.5 text-sm text-neutral-600 shadow-[0_2px_3px_-1px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/80 before:to-transparent before:opacity-80 after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_1px_1px_rgba(0,0,0,0.05),inset_0_-1px_1px_rgba(0,0,0,0.05)]"
      >
        <div className="relative z-10 flex items-center opacity-95">
          <span>© {new Date().getFullYear()}</span>
          <span className="ml-1 inline-flex items-center">
            henr.ee
            <Image
              src="/henry.png"
              alt="Henry's Icon"
              width={14}
              height={14}
              className="ml-1.5 rounded-sm"
            />
          </span>
        </div>
      </a>
    </div>
  );
}
