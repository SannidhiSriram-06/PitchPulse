import React from 'react'

export default function SquiCircleFilter({ blurValue = 10, colorMatrixValue = 20, alphaValue = -9 }) {
  const matrixString = `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${colorMatrixValue} ${alphaValue}`

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} width="0" height="0">
      <defs>
        <filter id="SkiperSquiCircleFilterLayout">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blurValue} result="blur" />
          <feColorMatrix in="blur" mode="matrix" values={matrixString} result="squircle" />
          <feComposite in="SourceGraphic" in2="squircle" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}
