import * as Autocompleter from "./";
var tokenTypes: { [id: string]: "prefixed" | "var" } = {
  "string-2": "prefixed",
  atom: "var"
};
const prefixCcApi =
  (window.location.protocol.indexOf("http") === 0 ? "//" : "http://") + "prefix.cc/popular/all.file.json";
import * as superagent from "superagent";
// //this autocompleter also fires on-change!
// yasqe.on("change", function() {
// module.exports.appendPrefixIfNeeded(yasqe, completerName);
// });
const NAME = "prefixes";
var conf: Autocompleter.CompleterConfig = {
  onInitialize: function(yasqe) {
    yasqe.on("change", function() {
      if (!yasqe.config.autocompleters || yasqe.config.autocompleters.indexOf("prefixes") == -1) return; //this autocompleter is disabled
      var cur = yasqe.getDoc().getCursor();

      var token: Autocompleter.AutocompletionToken = yasqe.getTokenAt(cur);
      if (tokenTypes[token.type] == "prefixed") {
        var colonIndex = token.string.indexOf(":");
        if (colonIndex !== -1) {
          // check previous token isnt PREFIX, or a '<'(which would mean we are in a uri)
          //			var firstTokenString = yasqe.getNextNonWsToken(cur.line).string.toUpperCase();
          var lastNonWsTokenString = yasqe.getPreviousNonWsToken(cur.line, token).string.toUpperCase();
          var previousToken = yasqe.getTokenAt({
            line: cur.line,
            ch: token.start
          }); // needs to be null (beginning of line), or whitespace
          if (lastNonWsTokenString != "PREFIX" && (previousToken.type == "ws" || previousToken.type == null)) {
            // check whether it isnt defined already (saves us from looping
            // through the array)
            var currentPrefix = token.string.substring(0, colonIndex + 1);

            var queryPrefixes = yasqe.getPrefixesFromQuery();
            if (queryPrefixes[currentPrefix.slice(0, -1)] == null) {
              // ok, so it isnt added yet!
              // var completions = yasqe.autocompleters.getTrie(completerName).autoComplete(currentPrefix);
              token.autocompletionString = currentPrefix;
              var completions = yasqe.autocompleters[NAME].getCompletions(token).then(suggestions => {
                if (suggestions.length) {
                  console.warn("TODO: add prefixes to query", suggestions[0]);
                  // yasqe.addPrefixes(completions[0]);
                }
              }, console.warn);
            }
          }
        }
      }
    });
  },
  isValidCompletionPosition: function(yasqe) {
    var cur = yasqe.getDoc().getCursor(),
      token = yasqe.getTokenAt(cur);

    // not at end of line
    if (yasqe.getDoc().getLine(cur.line).length > cur.ch) return false;

    if (token.type != "ws") {
      // we want to complete token, e.g. when the prefix starts with an a
      // (treated as a token in itself..)
      // but we to avoid including the PREFIX tag. So when we have just
      // typed a space after the prefix tag, don't get the complete token
      token = yasqe.getCompleteToken();
    }

    // we shouldnt be at the uri part the prefix declaration
    // also check whether current token isnt 'a' (that makes codemirror
    // thing a namespace is a possiblecurrent
    if (token.string.indexOf("a") !== 0 && token.state.possibleCurrent.indexOf("PNAME_NS") < 0) return false;

    // First token of line needs to be PREFIX,
    // there should be no trailing text (otherwise, text is wrongly inserted
    // in between)
    var previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
    if (!previousToken || previousToken.string.toUpperCase() != "PREFIX") return false;
    return true;
  },
  get: function(token) {
    return superagent.get(prefixCcApi).then(resp => {
      var prefixArray: string[] = [];
      for (var prefix in resp.body) {
        if (prefix == "bif") continue; // skip this one! see #231
        var completeString = prefix + ": <" + resp.body[prefix] + ">";
        prefixArray.push(completeString); // the array we want to store in localstorage
      }
      return prefixArray.sort();
    });
  },
  preProcessToken: function(yasqe, token) {
    var previousToken = yasqe.getPreviousNonWsToken(yasqe.getDoc().getCursor().line, token);
    if (previousToken && previousToken.string && previousToken.string.slice(-1) == ":") {
      //combine both tokens! In this case we have the cursor at the end of line "PREFIX bla: <".
      //we want the token to be "bla: <", en not "<"
      token = {
        start: previousToken.start,
        end: token.end,
        string: previousToken.string + " " + token.string,
        state: token.state,
        type: token.type
      };
    }
    return token;
  },
  async: true,
  bulk: true,
  autoShow: true,
  persistenceId: NAME,
  name: NAME
};

export default conf;
