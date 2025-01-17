type RequiredAndNotNull<T> = {
  [P in keyof T]-?: Exclude<T[P], undefined>
}

/**
 * not suitable for every object but it is enough for this library
 * @param object
 */
export function cleanUndefined<T extends Record<string, any>>(object: T) {
  if (!object || typeof object !== "object") {
    return object
  }
  return JSON.parse(JSON.stringify(object)) as RequiredAndNotNull<T>
}

function merge(previousValue: any, currentValue: any) {
  for (const p in currentValue) {
    if (currentValue[p] !== undefined) {
      if (typeof currentValue[p] === "object" && currentValue[p].constructor.name === "Object") {
        previousValue[p] = merge(previousValue[p] || {}, currentValue[p])
      } else {
        previousValue[p] = currentValue[p]
      }
    }
  }
  return previousValue
}
export function mergeObjects<T extends object, U>(obj1: T, obj2: U): RequiredAndNotNull<T & U>
export function mergeObjects<T extends object, U, K>(
  obj1: T,
  obj2: U,
  obj3: K,
): RequiredAndNotNull<T & U & K>
export function mergeObjects(...objects: any[]) {
  return objects.reduce((previousValue, currentValue) => {
    return merge(previousValue || {}, currentValue)
  }, {}) as any
}
