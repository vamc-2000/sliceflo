import * as React from "react"
const SvgComponent = (props:React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={42}
    height={42}
    fill="none"
    {...props}
  >
    <rect width={40.8} height={40.8} x={0.6} y={0.6} fill="#F2F2F7" rx={20.4} />
    <rect
      width={40.8}
      height={40.8}
      x={0.6}
      y={0.6}
      stroke="#8E8E93"
      strokeDasharray="5 5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={0.8}
      rx={20.4}
    />
    <path
      stroke="#8E8E93"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M24.334 28.5v-1.667A3.333 3.333 0 0 0 21 23.5h-5.833a3.333 3.333 0 0 0-3.333 3.333V28.5m15.833-10.833v5m2.5-2.5h-5m-3.75-3.334a3.333 3.333 0 1 1-6.667 0 3.333 3.333 0 0 1 6.667 0Z"
    />
  </svg>
)
export default SvgComponent
