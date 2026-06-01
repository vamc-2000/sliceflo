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
      d="M7.335 1.336H2A1.333 1.333 0 0 0 .668 2.669v10.667a1.333 1.333 0 0 0 1.333 1.333h8a1.333 1.333 0 0 0 1.334-1.333v-8m-4-4 4 4m-4-4v4h4M8.668 8.669H3.335m5.333 2.667H3.335m1.333-5.333H3.335"
    />
  </svg>
)
export default SvgComponent
