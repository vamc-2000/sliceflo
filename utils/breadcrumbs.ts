export interface Breadcrumb {
  label: string;
  href: string;
}

export const generateBreadcrumbs = (pathname: string, workspaceName: string = "Workspace"): Breadcrumb[] => {
  if (!pathname) return [];

  // Filter out empty segments and create breadcrumb items
  const segments = pathname
    .split("/")
    .filter((segment) => segment && segment !== "(pages)");

  const breadcrumbs: Breadcrumb[] = [
    { label: workspaceName, href: "/dashboard" },
  ];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable label (handle hyphens and capitalization)
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Don't add the last segment as a link (it's the current page)
    if (index === segments.length - 1) {
      breadcrumbs.push({ label, href: currentPath });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  });

  return breadcrumbs;
};
