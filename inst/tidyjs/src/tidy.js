(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-array'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Tidy = {}, global.d3));
}(this, (function (exports, d3Array) { 'use strict';

  function tidy(items, ...fns) {
    if (typeof items === "function") {
      throw new Error("You must supply the data as the first argument to tidy()");
    }
    let result = items;
    for (const fn of fns) {
      result = fn(result);
    }
    return result;
  }

  function filter(filterFn) {
    const _filter = (items) => items.filter(filterFn);
    return _filter;
  }

  function when(predicate, fns) {
    const _when = (items) => {
      if (typeof predicate === "function") {
        if (!predicate(items))
          return items;
      } else if (!predicate) {
        return items;
      }
      const results = tidy(items, ...fns);
      return results;
    };
    return _when;
  }

  function map(mapFn) {
    const _map = (items) => items.map(mapFn);
    return _map;
  }

  function singleOrArray(d) {
    return d == null ? [] : Array.isArray(d) ? d : [d];
  }

  function distinct(keys) {
    const _distinct = (items) => {
      keys = singleOrArray(keys);
      if (!keys.length) {
        const set = new Set();
        for (const item of items) {
          set.add(item);
        }
        return Array.from(set);
      }
      const rootMap = new Map();
      const distinctItems = [];
      const lastKey = keys[keys.length - 1];
      for (const item of items) {
        let map = rootMap;
        let hasItem = false;
        for (const key of keys) {
          const mapItemKey = typeof key === "function" ? key(item) : item[key];
          if (key === lastKey) {
            hasItem = map.has(mapItemKey);
            if (!hasItem) {
              distinctItems.push(item);
              map.set(mapItemKey, true);
            }
            break;
          }
          if (!map.has(mapItemKey)) {
            map.set(mapItemKey, new Map());
          }
          map = map.get(mapItemKey);
        }
      }
      return distinctItems;
    };
    return _distinct;
  }

  function arrange(comparators) {
    const _arrange = (items) => {
      const comparatorFns = singleOrArray(comparators).map((comp) => typeof comp === "function" ? comp : asc(comp));
      return items.slice().sort((a, b) => {
        for (const comparator of comparatorFns) {
          const result = comparator(a, b);
          if (result !== 0)
            return result;
        }
        return 0;
      });
    };
    return _arrange;
  }
  function asc(key) {
    return function _asc(a, b) {
      return d3Array.ascending(a[key], b[key]);
    };
  }
  function desc(key) {
    return function _desc(a, b) {
      return d3Array.descending(a[key], b[key]);
    };
  }
  function fixedOrder(key, order, options) {
    let {position = "start"} = options != null ? options : {};
    const positionFactor = position === "end" ? -1 : 1;
    const indexMap = new Map();
    for (let i = 0; i < order.length; ++i) {
      indexMap.set(order[i], i);
    }
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return function _fixedOrder(a, b) {
      var _a, _b;
      const aIndex = (_a = indexMap.get(keyFn(a))) != null ? _a : -1;
      const bIndex = (_b = indexMap.get(keyFn(b))) != null ? _b : -1;
      if (aIndex >= 0 && bIndex >= 0) {
        return aIndex - bIndex;
      }
      if (aIndex >= 0) {
        return positionFactor * -1;
      }
      if (bIndex >= 0) {
        return positionFactor * 1;
      }
      return 0;
    };
  }

  function summarize(summarizeSpec, options) {
    const _summarize = (items) => {
      options = options != null ? options : {};
      const summarized = {};
      const keys = Object.keys(summarizeSpec);
      for (const key of keys) {
        summarized[key] = summarizeSpec[key](items);
      }
      if (options.rest && items.length) {
        const objectKeys = Object.keys(items[0]);
        for (const objKey of objectKeys) {
          if (keys.includes(objKey)) {
            continue;
          }
          summarized[objKey] = options.rest(objKey)(items);
        }
      }
      return [summarized];
    };
    return _summarize;
  }
  function _summarizeHelper(items, summaryFn, predicateFn, keys) {
    if (!items.length)
      return [];
    const summarized = {};
    let keysArr;
    if (keys == null) {
      keysArr = Object.keys(items[0]);
    } else {
      keysArr = [];
      for (const keyInput of singleOrArray(keys)) {
        if (typeof keyInput === "function") {
          keysArr.push(...keyInput(items));
        } else {
          keysArr.push(keyInput);
        }
      }
    }
    for (const key of keysArr) {
      if (predicateFn) {
        const vector = items.map((d) => d[key]);
        if (!predicateFn(vector)) {
          continue;
        }
      }
      summarized[key] = summaryFn(key)(items);
    }
    return [summarized];
  }
  function summarizeAll(summaryFn) {
    const _summarizeAll = (items) => _summarizeHelper(items, summaryFn);
    return _summarizeAll;
  }
  function summarizeIf(predicateFn, summaryFn) {
    const _summarizeIf = (items) => _summarizeHelper(items, summaryFn, predicateFn);
    return _summarizeIf;
  }
  function summarizeAt(keys, summaryFn) {
    const _summarizeAt = (items) => _summarizeHelper(items, summaryFn, void 0, keys);
    return _summarizeAt;
  }

  function mutate(mutateSpec) {
    const _mutate = (items) => {
      const mutatedItems = [];
      for (const item of items) {
        const mutatedItem = {...item};
        for (const key in mutateSpec) {
          const mutateSpecValue = mutateSpec[key];
          const mutatedResult = typeof mutateSpecValue === "function" ? mutateSpecValue(mutatedItem) : mutateSpecValue;
          mutatedItem[key] = mutatedResult;
        }
        mutatedItems.push(mutatedItem);
      }
      return mutatedItems;
    };
    return _mutate;
  }

  function total(summarizeSpec, mutateSpec) {
    const _total = (items) => {
      const summarized = summarize(summarizeSpec)(items);
      const mutated = mutate(mutateSpec)(summarized);
      return [...items, ...mutated];
    };
    return _total;
  }
  function totalAll(summaryFn, mutateSpec) {
    const _totalAll = (items) => {
      const summarized = summarizeAll(summaryFn)(items);
      const mutated = mutate(mutateSpec)(summarized);
      return [...items, ...mutated];
    };
    return _totalAll;
  }
  function totalIf(predicateFn, summaryFn, mutateSpec) {
    const _totalIf = (items) => {
      const summarized = summarizeIf(predicateFn, summaryFn)(items);
      const mutated = mutate(mutateSpec)(summarized);
      return [...items, ...mutated];
    };
    return _totalIf;
  }
  function totalAt(keys, summaryFn, mutateSpec) {
    const _totalAt = (items) => {
      const summarized = summarizeAt(keys, summaryFn)(items);
      const mutated = mutate(mutateSpec)(summarized);
      return [...items, ...mutated];
    };
    return _totalAt;
  }

  function assignGroupKeys(d, keys) {
    return {
      ...d,
      ...keys.reduce((accum, key) => (accum[key[0]] = key[1], accum), {})
    };
  }

  function groupTraversal(grouped, outputGrouped, keys, addSubgroup, addLeaves, level = 0) {
    for (const [key, value] of grouped.entries()) {
      const keysHere = [...keys, key];
      if (value instanceof Map) {
        const subgroup = addSubgroup(outputGrouped, keysHere, level);
        groupTraversal(value, subgroup, keysHere, addSubgroup, addLeaves, level + 1);
      } else {
        addLeaves(outputGrouped, keysHere, value, level);
      }
    }
    return outputGrouped;
  }

  function groupMap(grouped, groupFn, keyFn = (keys) => keys[keys.length - 1]) {
    function addSubgroup(parentGrouped, keys) {
      const subgroup = new Map();
      parentGrouped.set(keyFn(keys), subgroup);
      return subgroup;
    }
    function addLeaves(parentGrouped, keys, values) {
      parentGrouped.set(keyFn(keys), groupFn(values, keys));
    }
    const outputGrouped = new Map();
    groupTraversal(grouped, outputGrouped, [], addSubgroup, addLeaves);
    return outputGrouped;
  }

  const identity = (d) => d;

  function groupBy(groupKeys, fns, options) {
    const _groupBy = (items) => {
      const grouped = makeGrouped(items, groupKeys);
      const results = runFlow(grouped, fns, options == null ? void 0 : options.addGroupKeys);
      if (options == null ? void 0 : options.export) {
        switch (options.export) {
          case "grouped":
            return results;
          case "entries":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["entries"]
            });
          case "entries-object":
          case "entries-obj":
          case "entriesObject":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["entries-object"]
            });
          case "object":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["object"]
            });
          case "map":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["map"]
            });
          case "keys":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["keys"]
            });
          case "values":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["values"]
            });
          case "levels":
            return exportLevels(results, options);
        }
      }
      const ungrouped = ungroup(results, options == null ? void 0 : options.addGroupKeys);
      return ungrouped;
    };
    return _groupBy;
  }
  groupBy.grouped = (options) => ({...options, export: "grouped"});
  groupBy.entries = (options) => ({...options, export: "entries"});
  groupBy.entriesObject = (options) => ({...options, export: "entries-object"});
  groupBy.object = (options) => ({...options, export: "object"});
  groupBy.map = (options) => ({...options, export: "map"});
  groupBy.keys = (options) => ({...options, export: "keys"});
  groupBy.values = (options) => ({...options, export: "values"});
  groupBy.levels = (options) => ({...options, export: "levels"});
  function runFlow(items, fns, addGroupKeys) {
    let result = items;
    if (!(fns == null ? void 0 : fns.length))
      return result;
    for (const fn of fns) {
      result = groupMap(result, (items2, keys) => {
        const context = {groupKeys: keys};
        let leafItemsMapped = fn(items2, context);
        if (addGroupKeys !== false) {
          leafItemsMapped = leafItemsMapped.map((item) => assignGroupKeys(item, keys));
        }
        return leafItemsMapped;
      });
    }
    return result;
  }
  function makeGrouped(items, groupKeys) {
    const groupKeyFns = singleOrArray(groupKeys).map((key, i) => {
      let keyName;
      if (typeof key === "function") {
        keyName = key.name ? key.name : `group_${i}`;
      } else {
        keyName = key.toString();
      }
      const keyFn = typeof key === "function" ? key : (d) => d[key];
      const keyCache = new Map();
      return (d) => {
        const keyValue = keyFn(d);
        if (keyCache.has(keyValue)) {
          return keyCache.get(keyValue);
        }
        const keyWithName = [keyName, keyValue];
        keyCache.set(keyValue, keyWithName);
        return keyWithName;
      };
    });
    const grouped = d3Array.group(items, ...groupKeyFns);
    return grouped;
  }
  function ungroup(grouped, addGroupKeys) {
    const items = [];
    groupTraversal(grouped, items, [], identity, (root, keys, values) => {
      let valuesToAdd = values;
      if (addGroupKeys !== false) {
        valuesToAdd = values.map((d) => assignGroupKeys(d, keys));
      }
      root.push(...valuesToAdd);
    });
    return items;
  }
  const defaultCompositeKey = (keys) => keys.join("/");
  function processFromGroupsOptions(options) {
    var _a;
    const {flat, single, mapLeaf = identity, mapLeaves = identity} = options;
    let compositeKey;
    if (options.flat) {
      compositeKey = (_a = options.compositeKey) != null ? _a : defaultCompositeKey;
    }
    const groupFn = (values, keys) => {
      return single ? mapLeaf(assignGroupKeys(values[0], keys)) : mapLeaves(values.map((d) => mapLeaf(assignGroupKeys(d, keys))));
    };
    const keyFn = flat ? (keys) => compositeKey(keys.map((d) => d[1])) : (keys) => keys[keys.length - 1][1];
    return {groupFn, keyFn};
  }
  function exportLevels(grouped, options) {
    const {groupFn, keyFn} = processFromGroupsOptions(options);
    let {mapEntry = identity} = options;
    const {levels = ["entries"]} = options;
    const levelSpecs = [];
    for (const levelOption of levels) {
      switch (levelOption) {
        case "entries":
        case "entries-object":
        case "entries-obj":
        case "entriesObject": {
          const levelMapEntry = levelOption === "entries-object" || levelOption === "entries-obj" || levelOption === "entriesObject" ? ([key, values]) => ({key, values}) : mapEntry;
          levelSpecs.push({
            id: "entries",
            createEmptySubgroup: () => [],
            addSubgroup: (parentGrouped, newSubgroup, key, level) => {
              parentGrouped.push(levelMapEntry([key, newSubgroup], level));
            },
            addLeaf: (parentGrouped, key, values, level) => {
              parentGrouped.push(levelMapEntry([key, values], level));
            }
          });
          break;
        }
        case "map":
          levelSpecs.push({
            id: "map",
            createEmptySubgroup: () => new Map(),
            addSubgroup: (parentGrouped, newSubgroup, key) => {
              parentGrouped.set(key, newSubgroup);
            },
            addLeaf: (parentGrouped, key, values) => {
              parentGrouped.set(key, values);
            }
          });
          break;
        case "object":
          levelSpecs.push({
            id: "object",
            createEmptySubgroup: () => ({}),
            addSubgroup: (parentGrouped, newSubgroup, key) => {
              parentGrouped[key] = newSubgroup;
            },
            addLeaf: (parentGrouped, key, values) => {
              parentGrouped[key] = values;
            }
          });
          break;
        case "keys":
          levelSpecs.push({
            id: "keys",
            createEmptySubgroup: () => [],
            addSubgroup: (parentGrouped, newSubgroup, key) => {
              parentGrouped.push([key, newSubgroup]);
            },
            addLeaf: (parentGrouped, key) => {
              parentGrouped.push(key);
            }
          });
          break;
        case "values":
          levelSpecs.push({
            id: "values",
            createEmptySubgroup: () => [],
            addSubgroup: (parentGrouped, newSubgroup) => {
              parentGrouped.push(newSubgroup);
            },
            addLeaf: (parentGrouped, key, values) => {
              parentGrouped.push(values);
            }
          });
          break;
        default: {
          if (typeof levelOption === "object") {
            levelSpecs.push(levelOption);
          }
        }
      }
    }
    const addSubgroup = (parentGrouped, keys, level) => {
      var _a, _b;
      if (options.flat) {
        return parentGrouped;
      }
      const levelSpec = (_a = levelSpecs[level]) != null ? _a : levelSpecs[levelSpecs.length - 1];
      const nextLevelSpec = (_b = levelSpecs[level + 1]) != null ? _b : levelSpec;
      const newSubgroup = nextLevelSpec.createEmptySubgroup();
      levelSpec.addSubgroup(parentGrouped, newSubgroup, keyFn(keys), level);
      return newSubgroup;
    };
    const addLeaf = (parentGrouped, keys, values, level) => {
      var _a;
      const levelSpec = (_a = levelSpecs[level]) != null ? _a : levelSpecs[levelSpecs.length - 1];
      levelSpec.addLeaf(parentGrouped, keyFn(keys), groupFn(values, keys), level);
    };
    const initialOutputObject = levelSpecs[0].createEmptySubgroup();
    return groupTraversal(grouped, initialOutputObject, [], addSubgroup, addLeaf);
  }

  function n() {
    return (items) => items.length;
  }

  function sum(items, accessor) {
    let sum2 = 0, correction = 0, temp = 0;
    for (let i = 0; i < items.length; i++) {
      let value = accessor === void 0 ? items[i] : accessor(items[i], i, items);
      if (+value !== value) {
        value = 0;
      }
      if (i === 0) {
        sum2 = value;
      } else {
        temp = sum2 + value;
        if (Math.abs(sum2) >= Math.abs(value)) {
          correction += sum2 - temp + value;
        } else {
          correction += value - temp + sum2;
        }
        sum2 = temp;
      }
    }
    return sum2 + correction;
  }
  function cumsum(items, accessor) {
    let sum2 = 0, correction = 0, temp = 0, cumsums = new Float64Array(items.length);
    for (let i = 0; i < items.length; i++) {
      let value = accessor === void 0 ? items[i] : accessor(items[i], i, items);
      if (+value !== value) {
        value = 0;
      }
      if (i === 0) {
        sum2 = value;
      } else {
        temp = sum2 + value;
        if (Math.abs(sum2) >= Math.abs(value)) {
          correction += sum2 - temp + value;
        } else {
          correction += value - temp + sum2;
        }
        sum2 = temp;
      }
      cumsums[i] = sum2 + correction;
    }
    return cumsums;
  }
  function mean(items, accessor) {
    let n = 0, sum2 = 0, correction = 0, temp = 0;
    for (let i = 0; i < items.length; i++) {
      let value = accessor === void 0 ? items[i] : accessor(items[i], i, items);
      if (+value !== value) {
        value = 0;
      } else {
        n++;
      }
      if (i === 0) {
        sum2 = value;
      } else {
        temp = sum2 + value;
        if (Math.abs(sum2) >= Math.abs(value)) {
          correction += sum2 - temp + value;
        } else {
          correction += value - temp + sum2;
        }
        sum2 = temp;
      }
    }
    return n ? (sum2 + correction) / n : void 0;
  }

  function sum$1(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => sum(items, keyFn);
  }

  function tally(options) {
    const _tally = (items) => {
      const {name = "n", wt} = options != null ? options : {};
      const summarized = summarize({[name]: wt == null ? n() : sum$1(wt)})(items);
      return summarized;
    };
    return _tally;
  }

  function count(groupKeys, options) {
    const _count = (items) => {
      options = options != null ? options : {};
      const {name = "n", sort} = options;
      const results = tidy(items, groupBy(groupKeys, [tally(options)]), sort ? arrange(desc(name)) : identity);
      return results;
    };
    return _count;
  }

  function rename(renameSpec) {
    const _rename = (items) => {
      return items.map((d) => {
        var _a;
        const mapped = {};
        const keys = Object.keys(d);
        for (const key of keys) {
          const newKey = (_a = renameSpec[key]) != null ? _a : key;
          mapped[newKey] = d[key];
        }
        return mapped;
      });
    };
    return _rename;
  }

  function slice(start, end) {
    const _slice = (items) => items.slice(start, end);
    return _slice;
  }
  const sliceHead = (n) => slice(0, n);
  const sliceTail = (n) => slice(-n);
  function sliceMin(n, orderBy) {
    const _sliceMin = (items) => arrange(orderBy)(items).slice(0, n);
    return _sliceMin;
  }
  function sliceMax(n, orderBy) {
    const _sliceMax = (items) => arrange(orderBy)(items).slice(-n).reverse();
    return _sliceMax;
  }
  function sliceSample(n, options) {
    options = options != null ? options : {};
    const {replace} = options;
    const _sliceSample = (items) => {
      if (!items.length)
        return items.slice();
      if (replace) {
        const sliced = [];
        for (let i = 0; i < n; ++i) {
          sliced.push(items[Math.floor(Math.random() * items.length)]);
        }
        return sliced;
      }
      return d3Array.shuffle(items.slice()).slice(0, n);
    };
    return _sliceSample;
  }

  function autodetectByMap(itemsA, itemsB) {
    if (itemsA.length === 0 || itemsB.length === 0)
      return {};
    const keysA = Object.keys(itemsA[0]);
    const keysB = Object.keys(itemsB[0]);
    const byMap = {};
    for (const key of keysA) {
      if (keysB.includes(key)) {
        byMap[key] = key;
      }
    }
    return byMap;
  }
  function makeByMap(by) {
    if (Array.isArray(by)) {
      const byMap = {};
      for (const key of by) {
        byMap[key] = key;
      }
      return byMap;
    } else if (typeof by === "object") {
      return by;
    }
    return {[by]: by};
  }
  function isMatch(d, j, byMap) {
    for (const jKey in byMap) {
      const dKey = byMap[jKey];
      if (d[dKey] !== j[jKey]) {
        return false;
      }
    }
    return true;
  }
  function innerJoin(itemsToJoin, options) {
    const _innerJoin = (items) => {
      const byMap = (options == null ? void 0 : options.by) == null ? autodetectByMap(items, itemsToJoin) : makeByMap(options.by);
      const joined = items.flatMap((d) => {
        const matches = itemsToJoin.filter((j) => isMatch(d, j, byMap));
        return matches.map((j) => ({...d, ...j}));
      });
      return joined;
    };
    return _innerJoin;
  }

  function leftJoin(itemsToJoin, options) {
    const _leftJoin = (items) => {
      const byMap = (options == null ? void 0 : options.by) == null ? autodetectByMap(items, itemsToJoin) : makeByMap(options.by);
      const joined = items.flatMap((d) => {
        const matches = itemsToJoin.filter((j) => isMatch(d, j, byMap));
        return matches.length ? matches.map((j) => ({...d, ...j})) : d;
      });
      return joined;
    };
    return _leftJoin;
  }

  function mutateWithSummary(mutateSpec) {
    const _mutate = (items) => {
      const mutatedItems = items.map((d) => ({...d}));
      for (const key in mutateSpec) {
        const mutateSpecValue = mutateSpec[key];
        const mutatedResult = typeof mutateSpecValue === "function" ? mutateSpecValue(mutatedItems) : mutateSpecValue;
        const mutatedVector = (mutatedResult == null ? void 0 : mutatedResult[Symbol.iterator]) && typeof mutatedResult !== "string" ? mutatedResult : items.map(() => mutatedResult);
        let i = -1;
        for (const mutatedItem of mutatedItems) {
          mutatedItem[key] = mutatedVector[++i];
        }
      }
      return mutatedItems;
    };
    return _mutate;
  }

  function keysFromItems(items) {
    if (items.length < 1)
      return [];
    const keys = Object.keys(items[0]);
    return keys;
  }

  function everything() {
    return (items) => {
      const keys = keysFromItems(items);
      return keys;
    };
  }

  function processSelectors(items, selectKeys) {
    let processedSelectKeys = [];
    for (const keyInput of singleOrArray(selectKeys)) {
      if (typeof keyInput === "function") {
        processedSelectKeys.push(...keyInput(items));
      } else {
        processedSelectKeys.push(keyInput);
      }
    }
    if (processedSelectKeys[0][0] === "-") {
      processedSelectKeys = [...everything()(items), ...processedSelectKeys];
    }
    const negationMap = {};
    const keysWithoutNegations = [];
    for (let k = processedSelectKeys.length - 1; k >= 0; k--) {
      const key = processedSelectKeys[k];
      if (key[0] === "-") {
        negationMap[key.substring(1)] = true;
        continue;
      }
      if (negationMap[key]) {
        negationMap[key] = false;
        continue;
      }
      keysWithoutNegations.unshift(key);
    }
    processedSelectKeys = Array.from(new Set(keysWithoutNegations));
    return processedSelectKeys;
  }
  function select(selectKeys) {
    const _select = (items) => {
      let processedSelectKeys = processSelectors(items, selectKeys);
      return items.map((d) => {
        const mapped = {};
        for (const key of processedSelectKeys) {
          mapped[key] = d[key];
        }
        return mapped;
      });
    };
    return _select;
  }

  function transmute(mutateSpec) {
    const _transmute = (items) => {
      const mutated = mutate(mutateSpec)(items);
      const picked = select(Object.keys(mutateSpec))(mutated);
      return picked;
    };
    return _transmute;
  }

  function addRows(itemsToAdd) {
    const _addRows = (items) => {
      if (typeof itemsToAdd === "function") {
        return [...items, ...singleOrArray(itemsToAdd(items))];
      }
      return [...items, ...singleOrArray(itemsToAdd)];
    };
    return _addRows;
  }

  function pivotWider(options) {
    const _pivotWider = (items) => {
      const {
        namesFrom,
        valuesFrom,
        valuesFill,
        valuesFillMap,
        namesSep = "_"
      } = options;
      const namesFromKeys = Array.isArray(namesFrom) ? namesFrom : [namesFrom];
      const valuesFromKeys = Array.isArray(valuesFrom) ? valuesFrom : [valuesFrom];
      const wider = [];
      if (!items.length)
        return wider;
      const idColumns = Object.keys(items[0]).filter((key) => !namesFromKeys.includes(key) && !valuesFromKeys.includes(key));
      const nameValuesMap = {};
      for (const item of items) {
        for (const nameKey of namesFromKeys) {
          if (nameValuesMap[nameKey] == null) {
            nameValuesMap[nameKey] = {};
          }
          nameValuesMap[nameKey][item[nameKey]] = true;
        }
      }
      const nameValuesLists = [];
      for (const nameKey in nameValuesMap) {
        nameValuesLists.push(Object.keys(nameValuesMap[nameKey]));
      }
      const baseWideObj = {};
      const combos = makeCombinations(namesSep, nameValuesLists);
      for (const nameKey of combos) {
        if (valuesFromKeys.length === 1) {
          baseWideObj[nameKey] = valuesFillMap != null ? valuesFillMap[valuesFromKeys[0]] : valuesFill;
          continue;
        }
        for (const valueKey of valuesFromKeys) {
          baseWideObj[`${valueKey}${namesSep}${nameKey}`] = valuesFillMap != null ? valuesFillMap[valueKey] : valuesFill;
        }
      }
      function widenItems(items2) {
        if (!items2.length)
          return [];
        const wide = {...baseWideObj};
        for (const idKey of idColumns) {
          wide[idKey] = items2[0][idKey];
        }
        for (const item of items2) {
          const nameKey = namesFromKeys.map((key) => item[key]).join(namesSep);
          if (valuesFromKeys.length === 1) {
            wide[nameKey] = item[valuesFromKeys[0]];
            continue;
          }
          for (const valueKey of valuesFromKeys) {
            wide[`${valueKey}${namesSep}${nameKey}`] = item[valueKey];
          }
        }
        return [wide];
      }
      if (!idColumns.length) {
        return widenItems(items);
      }
      const finish = tidy(items, groupBy(idColumns, [widenItems]));
      return finish;
    };
    return _pivotWider;
  }
  function makeCombinations(separator = "_", arrays) {
    function combine(accum, prefix, remainingArrays) {
      if (!remainingArrays.length && prefix != null) {
        accum.push(prefix);
        return;
      }
      const array = remainingArrays[0];
      const newRemainingArrays = remainingArrays.slice(1);
      for (const item of array) {
        combine(accum, prefix == null ? item : `${prefix}${separator}${item}`, newRemainingArrays);
      }
    }
    const result = [];
    combine(result, null, arrays);
    return result;
  }

  function pivotLonger(options) {
    const _pivotLonger = (items) => {
      var _a;
      const {namesTo, valuesTo, namesSep = "_"} = options;
      const cols = (_a = options.cols) != null ? _a : [];
      const colsKeys = processSelectors(items, cols);
      const namesToKeys = Array.isArray(namesTo) ? namesTo : [namesTo];
      const valuesToKeys = Array.isArray(valuesTo) ? valuesTo : [valuesTo];
      const hasMultipleNamesTo = namesToKeys.length > 1;
      const hasMultipleValuesTo = valuesToKeys.length > 1;
      const longer = [];
      for (const item of items) {
        const remainingKeys = Object.keys(item).filter((key) => !colsKeys.includes(key));
        const baseObj = {};
        for (const key of remainingKeys) {
          baseObj[key] = item[key];
        }
        const nameValueKeysWithoutValuePrefix = hasMultipleValuesTo ? Array.from(new Set(colsKeys.map((key) => key.substring(key.indexOf(namesSep) + 1)))) : colsKeys;
        for (const nameValue of nameValueKeysWithoutValuePrefix) {
          const entryObj = {...baseObj};
          for (const valueKey of valuesToKeys) {
            const itemKey = hasMultipleValuesTo ? `${valueKey}${namesSep}${nameValue}` : nameValue;
            const nameValueParts = hasMultipleNamesTo ? nameValue.split(namesSep) : [nameValue];
            let i = 0;
            for (const nameKey of namesToKeys) {
              const nameValuePart = nameValueParts[i++];
              entryObj[nameKey] = nameValuePart;
              entryObj[valueKey] = item[itemKey];
            }
          }
          longer.push(entryObj);
        }
      }
      return longer;
    };
    return _pivotLonger;
  }

  function expand(expandKeys) {
    const _expand = (items) => {
      const keyMap = makeKeyMap(expandKeys);
      const vectors = [];
      for (const key in keyMap) {
        const keyValue = keyMap[key];
        let values;
        if (typeof keyValue === "function") {
          values = keyValue(items);
        } else if (Array.isArray(keyValue)) {
          values = keyValue;
        } else {
          values = Array.from(new Set(items.map((d) => d[key])));
        }
        vectors.push(values.map((value) => ({[key]: value})));
      }
      return makeCombinations$1(vectors);
    };
    return _expand;
  }
  function makeCombinations$1(vectors) {
    function combine(accum, baseObj, remainingVectors) {
      if (!remainingVectors.length && baseObj != null) {
        accum.push(baseObj);
        return;
      }
      const vector = remainingVectors[0];
      const newRemainingArrays = remainingVectors.slice(1);
      for (const item of vector) {
        combine(accum, {...baseObj, ...item}, newRemainingArrays);
      }
    }
    const result = [];
    combine(result, null, vectors);
    return result;
  }
  function makeKeyMap(keys) {
    if (Array.isArray(keys)) {
      const keyMap = {};
      for (const key of keys) {
        keyMap[key] = key;
      }
      return keyMap;
    } else if (typeof keys === "object") {
      return keys;
    }
    return {[keys]: keys};
  }

  function vectorSeq(values, period = 1) {
    let [min, max] = d3Array.extent(values);
    const sequence = [];
    let value = min;
    while (value <= max) {
      sequence.push(value);
      value += period;
    }
    return sequence;
  }
  function vectorSeqDate(values, granularity = "day", period = 1) {
    let [min, max] = d3Array.extent(values);
    const sequence = [];
    let value = new Date(min);
    while (value <= max) {
      sequence.push(new Date(value));
      if (granularity === "day" || granularity === "d" || granularity === "days") {
        value.setUTCDate(value.getUTCDate() + 1 * period);
      } else if (granularity === "week" || granularity === "w" || granularity === "weeks") {
        value.setUTCDate(value.getUTCDate() + 7 * period);
      } else if (granularity === "month" || granularity === "m" || granularity === "months") {
        value.setUTCMonth(value.getUTCMonth() + 1 * period);
      } else if (granularity === "year" || granularity === "y" || granularity === "years") {
        value.setUTCFullYear(value.getUTCFullYear() + 1 * period);
      } else {
        throw new Error("Invalid granularity for date sequence: " + granularity);
      }
    }
    return sequence;
  }
  function fullSeq(key, period) {
    return function fullSeqInner(items) {
      period = period != null ? period : 1;
      const keyFn = typeof key === "function" ? key : (d) => d[key];
      return vectorSeq(items.map(keyFn), period);
    };
  }
  function fullSeqDate(key, granularity, period) {
    return function fullSeqDateInner(items) {
      granularity = granularity != null ? granularity : "day";
      period = period != null ? period : 1;
      const keyFn = typeof key === "function" ? key : (d) => d[key];
      return vectorSeqDate(items.map(keyFn), granularity, period);
    };
  }
  function fullSeqDateISOString(key, granularity, period) {
    return function fullSeqDateISOStringInner(items) {
      granularity = granularity != null ? granularity : "day";
      period = period != null ? period : 1;
      const keyFn = typeof key === "function" ? key : (d) => d[key];
      return vectorSeqDate(items.map((d) => new Date(keyFn(d))), granularity, period).map((date) => date.toISOString());
    };
  }

  function replaceNully(replaceSpec) {
    const _replaceNully = (items) => {
      const replacedItems = [];
      for (const d of items) {
        const obj = {...d};
        for (const key in replaceSpec) {
          if (obj[key] == null) {
            obj[key] = replaceSpec[key];
          }
        }
        replacedItems.push(obj);
      }
      return replacedItems;
    };
    return _replaceNully;
  }

  function complete(expandKeys, replaceNullySpec) {
    const _complete = (items) => {
      const expanded = expand(expandKeys)(items);
      const joined = leftJoin(items)(expanded);
      return replaceNullySpec ? replaceNully(replaceNullySpec)(joined) : joined;
    };
    return _complete;
  }

  function fill(keys) {
    const _fill = (items) => {
      const keysArray = singleOrArray(keys);
      const replaceMap = {};
      return items.map((d) => {
        const obj = {...d};
        for (const key of keysArray) {
          if (obj[key] != null) {
            replaceMap[key] = obj[key];
          } else if (replaceMap[key] != null) {
            obj[key] = replaceMap[key];
          }
        }
        return obj;
      });
    };
    return _fill;
  }

  function debug(label, options) {
    const _debug = (items, context) => {
      var _a;
      let prefix = "[tidy.debug";
      if ((_a = context == null ? void 0 : context.groupKeys) == null ? void 0 : _a.length) {
        const groupKeys = context.groupKeys;
        const groupKeyStrings = groupKeys.map((keyPair) => keyPair.join(": ")).join(", ");
        if (groupKeyStrings.length) {
          prefix += "|" + groupKeyStrings;
        }
      }
      options = options != null ? options : {};
      const {limit = 10, output = "table"} = options;
      const dashString = "--------------------------------------------------------------------------------";
      let numDashes = dashString.length;
      const prefixedLabel = prefix + "]" + (label == null ? "" : " " + label);
      numDashes = Math.max(0, numDashes - (prefixedLabel.length + 2));
      console.log(`${prefixedLabel} ${dashString.substring(0, numDashes)}`);
      console[output](limit == null || limit >= items.length ? items : items.slice(0, limit));
      return items;
    };
    return _debug;
  }

  function rate(numerator, denominator, allowDivideByZero) {
    return numerator == null || denominator == null ? void 0 : denominator === 0 && numerator === 0 ? 0 : !allowDivideByZero && denominator === 0 ? void 0 : numerator / denominator;
  }

  var math = /*#__PURE__*/Object.freeze({
    __proto__: null,
    rate: rate
  });

  function rate$1(numerator, denominator, options) {
    const numeratorFn = typeof numerator === "function" ? numerator : (d) => d[numerator];
    const denominatorFn = typeof denominator === "function" ? denominator : (d) => d[denominator];
    const {predicate, allowDivideByZero} = options != null ? options : {};
    return predicate == null ? (d) => {
      const denom = denominatorFn(d);
      const numer = numeratorFn(d);
      return rate(numer, denom, allowDivideByZero);
    } : (d) => {
      if (!predicate(d))
        return void 0;
      const denom = denominatorFn(d);
      const numer = numeratorFn(d);
      return rate(numer, denom, allowDivideByZero);
    };
  }

  function cumsum$1(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => cumsum(items, keyFn);
  }

  function roll(width, rollFn, options) {
    const {partial = false} = options != null ? options : {};
    return (items) => {
      return items.map((_, i) => {
        const endIndex = i;
        if (!partial && endIndex - width + 1 < 0) {
          return void 0;
        }
        const startIndex = Math.max(0, endIndex - width + 1);
        const itemsInWindow = items.slice(startIndex, endIndex + 1);
        return rollFn(itemsInWindow, endIndex);
      });
    };
  }

  function min(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => d3Array.min(items, keyFn);
  }

  function max(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => d3Array.max(items, keyFn);
  }

  function mean$1(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => mean(items, keyFn);
  }

  function meanRate(numerator, denominator) {
    const numeratorFn = typeof numerator === "function" ? numerator : (d) => d[numerator];
    const denominatorFn = typeof denominator === "function" ? denominator : (d) => d[denominator];
    return (items) => {
      const numerator2 = sum(items, numeratorFn);
      const denominator2 = sum(items, denominatorFn);
      return rate(numerator2, denominator2);
    };
  }

  function median(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => d3Array.median(items, keyFn);
  }

  function deviation(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => d3Array.deviation(items, keyFn);
  }

  function variance(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => d3Array.variance(items, keyFn);
  }

  function first(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => keyFn(items[0]);
  }

  function last(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => keyFn(items[items.length - 1]);
  }

  function startsWith(prefix, ignoreCase = true) {
    return (items) => {
      const regex = new RegExp(`^${prefix}`, ignoreCase ? "i" : void 0);
      const keys = keysFromItems(items);
      return keys.filter((d) => regex.test(d));
    };
  }

  function endsWith(suffix, ignoreCase = true) {
    return (items) => {
      const regex = new RegExp(`${suffix}$`, ignoreCase ? "i" : void 0);
      const keys = keysFromItems(items);
      return keys.filter((d) => regex.test(d));
    };
  }

  function contains(substring, ignoreCase = true) {
    return (items) => {
      const regex = new RegExp(substring, ignoreCase ? "i" : void 0);
      const keys = keysFromItems(items);
      return keys.filter((d) => regex.test(d));
    };
  }

  function matches(regex) {
    return (items) => {
      const keys = keysFromItems(items);
      return keys.filter((d) => regex.test(d));
    };
  }

  function numRange(prefix, range, width) {
    return (items) => {
      const keys = keysFromItems(items);
      const matchKeys = [];
      for (let i = range[0]; i <= range[1]; ++i) {
        const num = width == null ? i : new String("00000000" + i).slice(-width);
        matchKeys.push(`${prefix}${num}`);
      }
      return keys.filter((d) => matchKeys.includes(d));
    };
  }

  function negate(selectors) {
    return (items) => {
      let keySet = new Set();
      for (const selector of singleOrArray(selectors)) {
        if (typeof selector === "function") {
          const keys2 = selector(items);
          for (const key of keys2) {
            keySet.add(key);
          }
        } else {
          keySet.add(selector);
        }
      }
      const keys = Array.from(keySet).map((key) => `-${key}`);
      return keys;
    };
  }

  exports.TMath = math;
  exports.addItems = addRows;
  exports.addRows = addRows;
  exports.arrange = arrange;
  exports.asc = asc;
  exports.complete = complete;
  exports.contains = contains;
  exports.count = count;
  exports.cumsum = cumsum$1;
  exports.debug = debug;
  exports.desc = desc;
  exports.deviation = deviation;
  exports.distinct = distinct;
  exports.endsWith = endsWith;
  exports.everything = everything;
  exports.expand = expand;
  exports.fill = fill;
  exports.filter = filter;
  exports.first = first;
  exports.fixedOrder = fixedOrder;
  exports.fullSeq = fullSeq;
  exports.fullSeqDate = fullSeqDate;
  exports.fullSeqDateISOString = fullSeqDateISOString;
  exports.groupBy = groupBy;
  exports.innerJoin = innerJoin;
  exports.last = last;
  exports.leftJoin = leftJoin;
  exports.map = map;
  exports.matches = matches;
  exports.max = max;
  exports.mean = mean$1;
  exports.meanRate = meanRate;
  exports.median = median;
  exports.min = min;
  exports.mutate = mutate;
  exports.mutateWithSummary = mutateWithSummary;
  exports.n = n;
  exports.negate = negate;
  exports.numRange = numRange;
  exports.pick = select;
  exports.pivotLonger = pivotLonger;
  exports.pivotWider = pivotWider;
  exports.rate = rate$1;
  exports.rename = rename;
  exports.replaceNully = replaceNully;
  exports.roll = roll;
  exports.select = select;
  exports.slice = slice;
  exports.sliceHead = sliceHead;
  exports.sliceMax = sliceMax;
  exports.sliceMin = sliceMin;
  exports.sliceSample = sliceSample;
  exports.sliceTail = sliceTail;
  exports.sort = arrange;
  exports.startsWith = startsWith;
  exports.sum = sum$1;
  exports.summarize = summarize;
  exports.summarizeAll = summarizeAll;
  exports.summarizeAt = summarizeAt;
  exports.summarizeIf = summarizeIf;
  exports.tally = tally;
  exports.tidy = tidy;
  exports.total = total;
  exports.totalAll = totalAll;
  exports.totalAt = totalAt;
  exports.totalIf = totalIf;
  exports.transmute = transmute;
  exports.variance = variance;
  exports.vectorSeq = vectorSeq;
  exports.vectorSeqDate = vectorSeqDate;
  exports.when = when;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=tidy.js.map