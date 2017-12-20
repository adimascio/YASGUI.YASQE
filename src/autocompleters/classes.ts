

import * as Autocompleter from './';

var conf: Autocompleter.CompleterConfig = {
  onInitialize: function(yasqe) {
    // validPosition: yasqe.autocompleters.notifications.show,
    // invalidPosition: yasqe.autocompleters.notifications.hide
  },
  get: function(yasqe, token) {
    return Autocompleter.fetchFromLov(yasqe, 'class', token)
  },
  isValidCompletionPosition: function(yasqe) {
    const token = yasqe.getCompleteToken();
    if (token.string[0] === '?' || token.string[0] === '$') return false;
    const cur = yasqe.getDoc().getCursor();
    const previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
    if (previousToken.string === "a") return true;
    if (previousToken.string === "rdf:type") return true;
    if (previousToken.string === "rdfs:domain") return true;
    if (previousToken.string === "rdfs:range") return true;
    return false;
  },
  preProcessToken: function(yasqe,token) {
    return Autocompleter.preprocessIriForCompletion(yasqe,token)
  },
  postProcessSuggestion: function(yasqe, token, suggestedString) {
    return Autocompleter.postprocessIriCompletion(yasqe, token, suggestedString)
  },
  async: true,
  bulk: false,
  name: 'class'
}

export default conf;
