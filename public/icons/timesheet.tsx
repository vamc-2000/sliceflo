import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={12}
    height={16}
    fill="none"
    {...props}
  >
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.999 5.997v2l1 1m2.006 2.567-.233 2.553a1.334 1.334 0 0 1-1.333 1.214H4.552a1.333 1.333 0 0 1-1.333-1.214l-.234-2.553m.007-7.133.233-2.554A1.333 1.333 0 0 1 4.552.664h2.9a1.333 1.333 0 0 1 1.333 1.213l.234 2.554m1.646 3.566a4.667 4.667 0 1 1-9.333 0 4.667 4.667 0 0 1 9.333 0Z"
    />
  </svg>
)
export default SvgComponent
