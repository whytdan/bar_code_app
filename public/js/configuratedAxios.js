// import LocalStorageService from "../../public/js/LocalStorageService.js";

// LocalstorageService
const localStorageService = LocalStorageService.getService();

const authAxios = () => {
  const defaultOptions = {
    baseURL: "https://t-express-trozlla7xq-uc.a.run.app/",
    headers: {
      "Content-Type": "application/json",
    },
  };

  let configuratedAxios = axios.create(defaultOptions);

  configuratedAxios.interceptors.request.use(
    (config) => {
      const token = localStorageService.getAccessToken();
      config.headers.Authorization = token ? `Bearer ${token}` : "";
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  configuratedAxios.interceptors.response.use(
    (response) => {
      return response;
    },
    function (error) {
      const originalRequest = error.config;

      if (
        error.response.status === 403 &&
        originalRequest.url === "https://t-express-trozlla7xq-uc.a.run.app/api/v1/jwtauth/token/"
      ) {
        localStorageService.clearToken();
        return Promise.reject(error);
      }

      if (error.response.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorageService.getRefreshToken();
        return configuratedAxios
          .post("api/v1/jwtauth/refresh/", {
            refresh: refreshToken,
          })
          .then((res) => {
            if (res.status === 200) {
              localStorageService.setToken(res.data);
              const access_token = localStorageService.getAccessToken();

              configuratedAxios.defaults.headers.common["Authorization"] =
                "Bearer " + access_token;
              return configuratedAxios(originalRequest);
            }
          })
          .catch(e => {
            localStorageService.clearToken();
          })
      }
      return Promise.reject(error);
    }
  );

  return configuratedAxios;
};

const myAxios = authAxios();
