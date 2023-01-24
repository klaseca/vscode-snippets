export const templateToBody = (template) => {
  return template.split('\n').map((it) => it.replace(/ {2}/g, '\t'));
};

export const throwError = (msg) => () => {
  throw new Error(msg);
};

export const syncElseThrow = (fn, msg) => {
  try {
    return fn();
  } catch (error) {
    throw new Error(msg);
  }
};
