import * as React from "react"
const SvgComponent = (props:React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={19}
    height={18}
    fill="none"
    {...props}
  >
    <circle cx={6} cy={3.5} r={2.75} stroke="#fff" strokeWidth={1.5} />
    <circle cx={15} cy={3.5} r={2.75} stroke="#fff" strokeWidth={1.5} />
    <circle cx={15} cy={12.5} r={2.75} stroke="#fff" strokeWidth={1.5} />
  </svg>
)
export default SvgComponent
