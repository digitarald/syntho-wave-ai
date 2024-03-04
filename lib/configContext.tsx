"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

const ConfigContext = createContext({
  openaiApiKey: "",
  setOpenaiApiKey: (() => {}) as Dispatch<SetStateAction<string>>,
  model: "",
  setModel: (() => {}) as Dispatch<SetStateAction<string>>,
});

export const useConfig = () => {
  return useContext(ConfigContext);
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const loadConfig = () => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("config") || "{}");
    }
    return {};
  };

  const [openaiApiKey, setOpenaiApiKey] = useState(
    () => loadConfig().openaiApiKey || ""
  );
  const [model, setModel] = useState(() => loadConfig().model || "");

  useEffect(() => {
    const config = {
      openaiApiKey,
      model,
    };

    localStorage.setItem("config", JSON.stringify(config));
  }, [openaiApiKey, model]);

  const value = {
    openaiApiKey,
    setOpenaiApiKey,
    model,
    setModel,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};
