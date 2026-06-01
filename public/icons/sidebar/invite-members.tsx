import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={31}
    fill="none"
    {...props}
  >
    <rect width={30} height={30} y={0.5} fill="#C89056" rx={8} />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18 22.25v-1.5a3 3 0 0 0-3-3H9.75a3 3 0 0 0-3 3v1.5M21 12.5V17m2.25-2.25h-4.5m-3.375-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
)
export default SvgComponent
