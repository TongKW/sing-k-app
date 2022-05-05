//a generic function that sorts the list of object by the key on
//whether descending or ascending modes
export default function sortOnKey(list, key, descending = false) {
  return list.sort((firstObj, secObj) => {
    const x = firstObj[key];
    const y = secObj[key];
    return descending
      ? x < y
        ? 1
        : x > y
        ? -1
        : 0
      : x < y
      ? -1
      : x > y
      ? 1
      : 0;
  });
}
