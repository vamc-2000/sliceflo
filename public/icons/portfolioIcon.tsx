
import React from "react";

interface PortfolioIconProps {
    width?: number;
    height?: number;
}

export const PortfolioIcon: React.FC<PortfolioIconProps> = ({ width = 50, height = 50 }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
        >
            <rect width="50" height="50" fill="url(#pattern0_2615_42823)" />
            <defs>
                <pattern id="pattern0_2615_42823" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlinkHref="#image0_2615_42823" transform="scale(0.01)" />
                </pattern>
                <image
                    id="image0_2615_42823"
                    width="100"
                    height="100"
                    preserveAspectRatio="none"
                    xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAETElEQVR4nO2dXWgcVRiGP0lRMFDBpldKxTaGlrZQTClUaXfPGVJWGsic6KppY9tkk5hEOiqivRJ6oYVWsbn12qtuL+sPVtQrFfS2vS0F2dmiZg1Jdjd/5JOTEqzbUnYzZ/PNju8L713mZL7nmTmzu2QJEYIgCIIgCIIgCIIgCIIgCIJsSnp6etq11i9prXNKqbFGao/xPC/T29v7OHRFTDabfVRrfUEpNa+15ii1ayilPrJrQswGkslkHlNK/RhVxAP6vV0bUhqM1vqzJshY7yUIaSCpVKpDKbVQs+UsKqV+VUp910i11r9prZdq1lrwPG8bpNQZpdRAzRVdVUp1bxSgPbZWsOd5r0FIndFan6sR8m1UeEqp6zVrnoOQ+uGdr4GXjwrPrlGzbZ1PpJDyqeee+ntwx7MuO5l5YWrg2FFe79CxF7+KuqZd49417e9wfd6WxaYLmMk9/WQlt/vq0sTBmdWzR5mDNBr8y8AyWRzvnqmM7M5bVk2VUc51vrvy1uEVSEjXdREuTx5emRvqfKc5Moa7Pl0NUrgbgsZ2BMusnOv6xKmM2aHOV7A9pTd8Ma6ePcLl4V2+MyGL489PY5tKR9odlt7sLjmRMTuyqw8y0k626vnhnccjC6nk9nwJIWknQiq5PdciC6mO7r8JIWknQqpj+29EFrIwduB3CEk7EWJZQkgQnzeuEBLIS4CQQB48hATysCEkkAcMIYE8VAgJ5EFCSCAPD0JiAIwhRB4SQ4g8GIYQeRgcg+Kjk0Bewv9DyIf9zBfPPLz2Z6TPM/FC3lbMv+SZ527X15/zd4+RPu/ECrnwRv0y1vvxoPx5J1bI5fHGhdhjpM8bQm4nWci+W9KDcELukMrovluRhZRzXfH5I4fLrS1kfrjrZmQh0wMdP0gPwgl5qFuWkYUU/EeuLk8cEh+Gbe1LWPtStl4ZP12Jzcve5clDbFlGF2IoXzrRIT4Qt/gbw+kT29iydCIkNMRzZ3aKD8UtWsvOMnQqxHb29DPM+EoC1y8jxbOnd6yxa4oQ2z9ebefqyN61bwpJX3kc01o21dG9a6zuZdcUIestvtzGf76+le3zpXRyO3py+xoLy6TY33Yfr6YLQalhBhBi4nXhQIiRlwAhRh48hBh52BBi5AFDiJGHCiFGHiSEGHl4EBIDYCGEyEMKIUQeTAgh8jDCGBQfnRh5CRBi5MFDiJGHDSFGHjCEGHmoEGLkQUKIkYcHITEAFkKIPKSwBYV8IT1ImJBali6EXJIeJExOL7oQYmIwCCehBZ/6Igsp9lB7aKgkPUzY6vVputBLbv5TXNGn98UHMi3efnqPXIWz1FYw9LX4UKZF69N1TtEWcplSlp4o+PSN+HCmtWov5L8ytJWaEXunhIYmC4buSA8axrwFn4qhTxOWWVNk/EdMirYUDelCH30QGpoKDX2OkmUwZZ+3xX5SzrcoBEEQBEEQBEEQBEFo8/MPmPril6fl8VcAAAAASUVORK5CYII="
                />
            </defs>
        </svg>
    );
};
