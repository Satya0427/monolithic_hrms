interface ApiResponse {
    sts: number;
    msg: string;
}

interface ApiDataResponse<T> extends ApiResponse {
    data: T;
}

const apiResponse = (sts: number, msg: string): ApiResponse => {
    return {
        sts,
        msg
    }
}

const apiDataResponse = <T>(sts: number, msg: string, data: T): ApiDataResponse<T> => {
    return {
        sts,
        msg,
        data
    }
}

export { apiResponse, apiDataResponse, ApiResponse, ApiDataResponse };
