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
    <g clipPath="url(#a)">
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 7.25v16.5m3.75-13.5h-5.625a2.625 2.625 0 0 0 0 5.25h3.75a2.625 2.625 0 0 1 0 5.25H10.5"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M6 6.5h18v18H6z" />
      </clipPath>
    </defs>
  </svg>
)
export default SvgComponent
