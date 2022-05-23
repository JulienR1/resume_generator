const locales = ["fr", "en"];
const requestedLocale =
  window.location.search?.replace("?lang=", "") ?? locales[0];
const locale = locales.find((lang) => lang === requestedLocale) ?? locales[0];

const resourcesPromise = fetch(`./lang/${locale}.json`).then((file) =>
  file.json()
);

resourcesPromise.then((resources) => {
  const flattenedResources = flatten(resources);
  const rootFields = getFieldsInNode();
  translate(flattenedResources, rootFields);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  document.getElementById(
    "now"
  ).textContent = `${resources.months[month]} ${year}`;
});
