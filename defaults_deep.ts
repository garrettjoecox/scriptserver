export function defaultsDeep(
  target: Record<string, any>,
  ...sources: Record<string, any>[]
) {
  sources.forEach((source) => {
    for (const key in source) {
      if (target.hasOwnProperty(key)) {
        if (!Array.isArray(source[key]) && typeof source[key] === "object") {
          defaultsDeep(target[key], source[key]);
        }
      } else {
        target[key] = source[key];
      }
    }
  });

  return target;
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
