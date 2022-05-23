const getFieldsInNode = (
  { node, patternToRemove } = { node: document, patternToRemove: undefined }
) => {
  return Array.from(node.querySelectorAll("[t]")).map((field) => {
    const t = field.getAttribute("t").replace(patternToRemove, "");
    return {
      t,
      node: field,
      isArray: t.endsWith("[]"),
    };
  });
};

const flatten = (obj, parent = "") => {
  return Object.keys(obj).reduce((flattened, key) => {
    const completeKey = parent.length > 0 ? `${parent}.${key}` : key;
    const element = obj[key];
    const isObject = typeof element === "object";

    return isObject
      ? { ...flattened, ...flatten(element, completeKey) }
      : { ...flattened, [completeKey]: element.toString() };
  }, {});
};

const translate = (resources, fields) => {
  fields.forEach(({ t, node, isArray }) => {
    if (isArray) {
      translateArrayField(resources, { t, node });
    } else if (resources[t]) {
      node.innerHTML = resources[t];
    } else if (!node.hasAttribute("optional")) {
      noTranslation(node, t);
    }
  });
};

const translateArrayField = (resources, { t, node }) => {
  const keyRegex = new RegExp(t.replace("[]", "\\d*"));
  const keys = Object.keys(resources).filter((key) => keyRegex.test(key));

  if (keys.length === 0) {
    noTranslation(node, t);
    return;
  }

  const nestedElements = getFieldsInNode({ node });
  const isNestedObject = node.children.length > 0 && nestedElements.length > 0;

  if (isNestedObject) {
    const nestedCount =
      parseInt(
        keys
          .map((key) => key.match(keyRegex)[0].split(".").reverse()[0])
          .reverse()[0]
      ) + 1;

    for (let i = 0; i < nestedCount; i++) {
      const keyPrefix = t.replace("[]", i);

      const generatedNode = node.cloneNode(true);
      generatedNode.setAttribute("t", keyPrefix);

      const fields = getFieldsInNode({ node: generatedNode });
      const nestedFields = fields.map((field) => ({
        ...field,
        t: field.t.replace(`${t}.`, ""),
      }));

      const nestedResources = Object.keys(resources)
        .filter((key) => key.includes(keyPrefix))
        .reduce(
          (all, key) => ({
            ...all,
            [key.replace(`${keyPrefix}.`, "")]: resources[key],
          }),
          {}
        );

      generatedNode.querySelectorAll("[t]").forEach((subnode) => {
        const subnodeKey = subnode.getAttribute("t");
        const formattedKey = subnodeKey.replace(t, keyPrefix);
        subnode.setAttribute("t", formattedKey);
      });

      translate(nestedResources, nestedFields);
      node.insertAdjacentElement("beforebegin", generatedNode);
    }
  } else {
    keys.forEach((key) => {
      const generatedNode = node.cloneNode();
      generatedNode.innerHTML = resources[key];
      generatedNode.setAttribute("t", key);
      node.insertAdjacentElement("beforebegin", generatedNode);
    });
  }
  node.remove();
};

const noTranslation = (node, t) => {
  node.innerHTML = `NO TRANSLATION FOUND FOR '${t}'`;
};
