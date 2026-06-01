import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={60}
    height={60}
    fill="none"
    {...props}
  >
    <path
      stroke="#E71D36"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="m20 15.002 32.5.002M20 30.002l32.5.002M20 45.002l32.5.002M8.75 15h.025M8.75 30h.025M8.75 45h.025M10 15a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 15a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0 15a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
    />
  </svg>
)
export default SvgComponent
