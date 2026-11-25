import { useLayoutEffect, useRef, type ComponentProps } from "react";

export function MovementCommentInput(props: ComponentProps<"textarea">) {
  const field = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    const resize = () => {
      element.style.height = "0px";
      const style = getComputedStyle(element);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      element.style.height = `${Math.min(element.scrollHeight + border, parseFloat(style.maxHeight))}px`;
    };
    resize();
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width === element.clientWidth) return;
      width = element.clientWidth;
      resize();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [props.value]);
  return <textarea {...props} ref={field} />;
}
