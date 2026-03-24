import { io } from "socket.io-client";
import config from "@/config";

const socket = io(config.apiWs, { autoConnect: false });
export default socket;
