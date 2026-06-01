export interface AxisField {
    field: string;
    type: string;
    label: string;
    chartTypes: string[];
    description: string;
    aggregations?: string[];
}

interface AxesResponse {
    cartesian: {
        xAxis: AxisField[];
        yAxis: AxisField[];
    };
    circular: {
        category: AxisField[];
        value: AxisField[];
    };
    radar: {
        category: AxisField[];
        value: AxisField[];
    };
}

export type ChartDataItem = {
    name: string;
    value: number;
};

export type BaseChartProps = {
    data?: ChartDataItem[] | null;
    isConfigured?: boolean;
};
