const STORAGE_KEYS = {
  RESULTS: 'npu_ng_exam_results_v1'
};

function getStoredResults() {
  try {
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS));
    return Array.isArray(results) ? results : [];
  } catch (e) {
    return [];
  }
}

function saveStoredResults(arr) {
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(arr));
}
