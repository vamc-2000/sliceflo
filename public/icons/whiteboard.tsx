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
      d="M8.668 2.67h1.333a1.333 1.333 0 0 1 1.334 1.333v9.333A1.333 1.333 0 0 1 10 14.669h-8a1.333 1.333 0 0 1-1.333-1.333V4.003a1.333 1.333 0 0 1 1.333-1.334h1.334M4 1.336h4c.368 0 .667.298.667.667v1.333a.667.667 0 0 1-.667.667h-4a.667.667 0 0 1-.666-.667V2.003c0-.369.298-.667.666-.667Z"
    />
  </svg>
)
export default SvgComponent
