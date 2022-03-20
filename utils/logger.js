import log from "loglevel";
import loglevelPlugin from "loglevel-plugin-server/lib/loglevel-plugin-server.min";

const options = {
  url: "http://localhost:3010/log",
};
log.getLogger("main");
loglevelPlugin(log, options);
log.setDefaultLevel("DEBUG");
export default log;
