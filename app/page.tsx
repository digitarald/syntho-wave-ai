"use client";

import { useState, useEffect } from "react";
import { useConfig } from "../lib/configContext";
import { FaArrowDown, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { Agents } from "@/lib/llm";

const cache: Record<string, string[]> = {};

const IndexPage = () => {
  const { openaiApiKey, setOpenaiApiKey, model, setModel } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (cache[openaiApiKey]) {
        setModels(cache[openaiApiKey]);
        return;
      }

      try {
        const models = await Agents.fetchModels(openaiApiKey);
        cache[openaiApiKey] = models;
        setModels(models);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    })();
  }, [openaiApiKey]);

  const handleOpenaiApiKeyChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOpenaiApiKey(event.target.value);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(event.target.value);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md">
        <h1 className="mb-4 font-bold text-3xl text-center">SynthoWave</h1>
        <div className="bg-white shadow-md mb-4 px-8 pt-6 pb-8 rounded">
          <Link
            href="/live"
            className="block bg-blue-500 px-4 py-2 rounded text-center text-white text-xl"
          >
            Start Live Session
          </Link>
        </div>
        <form className="bg-white shadow-md rounded">
          <h2
            className="flex px-8 py-4 items-center bg-gray-100 mb-4 text-lg cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <FaArrowDown size={15} className="inline mr-2" />
            ) : (
              <FaArrowRight size={15} className="inline mr-2" />
            )}
            Settings
          </h2>
          {isOpen && (
            <>
              <div className="px-8 pt-6">
                <label htmlFor="openaiApiKey" className="block mb-2 font-bold">
                  OpenAI API Key:
                </label>
                <input
                  type="text"
                  id="openaiApiKey"
                  value={openaiApiKey}
                  onChange={handleOpenaiApiKeyChange}
                  required={true}
                  pattern="sk-[a-zA-Z0-9]{48}|[a-zA-Z0-9]{64}"
                  className="border-gray-300 invalid:bg-red-100 px-4 py-2 border rounded-md w-full"
                />
              </div>
              <div className="mb-4 px-8 pt-6 pb-8">
                <label htmlFor="model" className="block mb-2 font-bold">
                  LLM Model:
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={handleModelChange}
                  className="border-gray-300 px-4 py-2 border rounded-md w-full"
                >
                  <option value="" disabled>
                    Select One
                  </option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default IndexPage;
