"use client";

type DeleteButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmMessage: string;
  hiddenFields?: Record<string, string>;
};

export function DeleteButton({
  action,
  id,
  label = "حذف",
  confirmMessage,
  hiddenFields,
}: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}
