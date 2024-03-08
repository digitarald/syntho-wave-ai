"use client";
import { useEffect, useRef, useState } from "react";
import { Agents, advisorList, TranscriptSummary } from "../../lib/llm";
import { transcript as simulation } from "../../lib/simulate2";
import { FaPause, FaCog, FaMicrophone, FaRobot } from "react-icons/fa";
import { useConfig } from "@/lib/configContext";

interface Transcript {
  text: string;
  status?: "analyzing" | "done";
  analysis?: TranscriptSummary;
}

export default function Home() {
  const { openaiApiKey, model } = useConfig();

  // redirect back when openaiApiKey or model is not set
  // useEffect(() => {
  //   if (!openaiApiKey || !model) {
  //     redirect("/");
  //   }
  // }, [openaiApiKey, model]);

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [TTSRunning, setTTSRunning] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const simulationRunningRef = useRef(simulationRunning);
  useEffect(() => {
    simulationRunningRef.current = simulationRunning;
  }, [simulationRunning]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [advisor, setAdvisor] = useState(advisorList[0]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Already running
    if (transcripts.find((transcript) => transcript.status == "analyzing")) {
      return;
    }
    // No new transcript
    const lastEntry = transcripts[transcripts.length - 1];
    if (!lastEntry || "status" in lastEntry) {
      return;
    }
    // Update status to mark as analyzing
    setTranscripts((prev) => [
      ...prev.slice(0, -1),
      {
        ...lastEntry,
        status: "analyzing",
      },
    ]);

    const lastAnalysis = transcripts
      .toReversed()
      .find((transcript) => transcript.analysis)?.analysis;

    new Agents(openaiApiKey, model)
      .reviewLatest(
        advisor,
        transcripts.map((transcript) => transcript.text),
        lastAnalysis?.recommendation
      )
      .then((analysis) => {
        setTranscripts((prev) => {
          return prev.map((transcript) => {
            if (transcript.text === lastEntry.text) {
              return { ...transcript, status: "done", analysis };
            }
            return transcript;
          });
        });
      });
  }, [advisor, model, openaiApiKey, transcripts]);

  useEffect(() => {
    const startSimulation = async () => {
      setTranscripts([]);
      const synth = window.speechSynthesis;
      for (const text of simulation) {
        const utterance = new SpeechSynthesisUtterance(text);
        // "Microsoft Ava Online (Natural) - English (United States)"
        utterance.voice =
          synth.getVoices().find(
            (voice) =>
              voice.name ===
              "Microsoft Ava Online (Natural) - English (United States)"
            // voice.name ===
            // "Microsoft Maria Online (Natural) - Spanish (Costa Rica)"
          ) || null;
        // utterance.lang = "es-ES";
        synth.speak(utterance);
        for (const word of text.split(/[\s]+/)) {
          if (!simulationRunningRef.current) {
            break;
          }
          setInterimTranscript((prev) => prev + " " + word);
          await new Promise((resolve) => setTimeout(resolve, word.length * 75));
        }
        while (synth.speaking) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        setInterimTranscript("");
        setTranscripts((prev) => [
          ...prev,
          {
            text,
          },
        ]);
        if (!simulationRunningRef.current) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setSimulationRunning(false);
    };

    if (simulationRunning) {
      startSimulation();
    }
  }, [simulationRunning]);

  useEffect(() => {
    let recognition: SpeechRecognition | undefined;

    const startTTS = () => {
      if ("SpeechRecognition" in window) {
        recognition = new window.SpeechRecognition();
      } else if ("webkitSpeechRecognition" in window) {
        // @ts-ignore
        recognition = new window.webkitSpeechRecognition();
      }
      if (!recognition) {
        console.error("SpeechRecognition not available");
        return;
      }
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      // @ts-ignore
      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;

        if (result.isFinal) {
          console.log("final transcript", text);
          console.log("transcripts", transcripts);

          setInterimTranscript("");
          setTranscripts((prev) => [
            ...prev,
            {
              text,
            },
          ]);
        } else {
          console.log("interim transcript", text);
          setInterimTranscript(text);
        }
      };

      recognition.start();
    };

    if (TTSRunning) {
      startTTS();
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [TTSRunning, transcripts]);

  let lastSpeaker = 0;

  return (
    <>
      <main className="flex flex-row items-stretch flex-grow overflow-y-auto justify-stretch">
        <div className="w-2/3 py-4 ml-4">
          {transcripts
            .map((transcript, index) => {
              if (!transcript.analysis?.recommendation) {
                return;
              }
              return (
                <div
                  className={`text-lg bg-red px-2 py-2 first:bg-red-900 transition-colors leading-tight rounded-lg first:text-white first:text-2xl first:px-4 first:text-center first:font-semibold first:leading-normal ${
                    highlightedIndex === index ? "bg-yellow-200" : ""
                  }`}
                  key={`analysis-${index}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(null)}
                >
                  {transcript.analysis?.recommendation}
                </div>
              );
            })
            .toReversed()}
        </div>
        <div className="justify-end w-1/3 p-4 mx-4 my-4 leading-loose bg-white rounded-lg shadow-md">
          <div className="text-gray-500">
            {TTSRunning || simulationRunning ? (
              <FaMicrophone className="inline duration-75 ease-in-out animate-pulse" />
            ) : (
              <span className="flex items-center text-gray-300">
                <span className="font-bold uppercase">Ready! Set!</span>{" "}
                <FaMicrophone className="inline ml-2" />
              </span>
            )}
            {interimTranscript}
          </div>
          {transcripts
            .map((transcript, index) => {
              const speakerChanged =
                transcript.analysis?.speaker !== lastSpeaker;
              lastSpeaker = transcript.analysis?.speaker || 0;
              return (
                <span
                  key={`text-${index}`}
                  className={`mr-2 transition-colors ${
                    speakerChanged ? "block " : "inline-block "
                  } ${
                    transcript.analysis
                      ? transcript.analysis?.speaker == 1
                        ? "text-blue-900 "
                        : "text-green-900 "
                      : "text-gray-700 "
                  } ${index === 0 ? "font-semibold " : ""} ${
                    highlightedIndex === index ? "bg-yellow-200 " : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(null)}
                >
                  {transcript.text}
                </span>
              );
            })
            .toReversed()}
        </div>
      </main>
      <nav className="flex justify-around p-2 bg-white border-t-2">
        <button
          className={`flex items-center rounded-md px-3 py-1 ${
            !TTSRunning
              ? ""
              : "bg-red-400 animate-pulse ease-in-out duration-75"
          }`}
          onClick={() => setTTSRunning(!TTSRunning)}
        >
          {TTSRunning ? (
            <FaPause className="mr-1" />
          ) : (
            <FaMicrophone className="mr-1" />
          )}
          <span>{TTSRunning ? "Pause" : "Listen"}</span>
        </button>
        <button
          className={`flex items-center rounded-md px-3 py-1 ${
            !simulationRunning
              ? ""
              : "bg-red-400 animate-pulse ease-in-out	duration-75"
          }`}
          onClick={() => setSimulationRunning(!simulationRunning)}
        >
          {simulationRunning ? (
            <FaPause className="mr-1" />
          ) : (
            <FaRobot className="mr-1" />
          )}
          <span>Simulate</span>
        </button>
        <div className="flex items-center">
          <FaCog className="mr-1" />
          <span>Advisor: </span>
          <select
            value={advisor}
            onChange={(e) => setAdvisor(e.target.value)}
            className="ml-1"
          >
            {advisorList.map((advisor) => (
              <option key={advisor} value={advisor}>
                {advisor}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </>
  );
}
