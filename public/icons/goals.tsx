import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.999 14.67a6.667 6.667 0 1 0 0-13.334 6.667 6.667 0 0 0 0 13.333Z"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.999 12.003a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.999 9.336a1.333 1.333 0 1 0 0-2.667 1.333 1.333 0 0 0 0 2.667Z"
    />
  </svg>
)
export default SvgComponent
