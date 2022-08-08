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
      if (fn) {
        result = fn(result);
      }
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
      const comparatorFns = singleOrArray(comparators).map((comp) => typeof comp === "function" ? comp.length === 1 ? asc(comp) : comp : asc(comp));
      return items.slice().sort((a, b) => {
        for (const comparator of comparatorFns) {
          const result = comparator(a, b);
          if (result)
            return result;
        }
        return 0;
      });
    };
    return _arrange;
  }
  function asc(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return function _asc(a, b) {
      return emptyAwareComparator(keyFn(a), keyFn(b), false);
    };
  }
  function desc(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return function _desc(a, b) {
      return emptyAwareComparator(keyFn(a), keyFn(b), true);
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
  function emptyAwareComparator(aInput, bInput, desc2) {
    let a = desc2 ? bInput : aInput;
    let b = desc2 ? aInput : bInput;
    if (isEmpty(a) && isEmpty(b)) {
      const rankA = a !== a ? 0 : a === null ? 1 : 2;
      const rankB = b !== b ? 0 : b === null ? 1 : 2;
      const order = rankA - rankB;
      return desc2 ? -order : order;
    }
    if (isEmpty(a)) {
      return desc2 ? -1 : 1;
    }
    if (isEmpty(b)) {
      return desc2 ? 1 : -1;
    }
    return d3Array.ascending(a, b);
  }
  function isEmpty(value) {
    return value == null || value !== value;
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
      const mutatedItems = items.map((d) => ({...d}));
      let i = 0;
      for (const mutatedItem of mutatedItems) {
        for (const key in mutateSpec) {
          const mutateSpecValue = mutateSpec[key];
          const mutatedResult = typeof mutateSpecValue === "function" ? mutateSpecValue(mutatedItem, i, mutatedItems) : mutateSpecValue;
          mutatedItem[key] = mutatedResult;
        }
        ++i;
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
    if (d == null || typeof d !== "object" || Array.isArray(d))
      return d;
    const keysObj = Object.fromEntries(keys.filter((key) => typeof key[0] !== "function"));
    return Object.assign(keysObj, d);
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

  function isObject(obj) {
    const type = typeof obj;
    return obj != null && (type === "object" || type === "function");
  }

  function groupBy(groupKeys, fns, options) {
    if (typeof fns === "function") {
      fns = [fns];
    } else if (arguments.length === 2 && fns != null && !Array.isArray(fns)) {
      options = fns;
    }
    const _groupBy = (items) => {
      const grouped = makeGrouped(items, groupKeys);
      const results = runFlow(grouped, fns, options == null ? void 0 : options.addGroupKeys);
      if (options == null ? void 0 : options.export) {
        switch (options.export) {
          case "grouped":
            return results;
          case "levels":
            return exportLevels(results, options);
          case "entries-obj":
          case "entriesObject":
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: ["entries-object"]
            });
          default:
            return exportLevels(results, {
              ...options,
              export: "levels",
              levels: [options.export]
            });
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
      if (!fn)
        continue;
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
      const keyFn = typeof key === "function" ? key : (d) => d[key];
      const keyCache = new Map();
      return (d) => {
        const keyValue = keyFn(d);
        const keyValueOf = isObject(keyValue) ? keyValue.valueOf() : keyValue;
        if (keyCache.has(keyValueOf)) {
          return keyCache.get(keyValueOf);
        }
        const keyWithName = [key, keyValue];
        keyCache.set(keyValueOf, keyWithName);
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
    const {
      flat,
      single,
      mapLeaf = identity,
      mapLeaves = identity,
      addGroupKeys
    } = options;
    let compositeKey;
    if (options.flat) {
      compositeKey = (_a = options.compositeKey) != null ? _a : defaultCompositeKey;
    }
    const groupFn = (values, keys) => {
      return single ? mapLeaf(addGroupKeys === false ? values[0] : assignGroupKeys(values[0], keys)) : mapLeaves(values.map((d) => mapLeaf(addGroupKeys === false ? d : assignGroupKeys(d, keys))));
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
          const levelMapEntry = (levelOption === "entries-object" || levelOption === "entries-obj" || levelOption === "entriesObject") && options.mapEntry == null ? ([key, values]) => ({key, values}) : mapEntry;
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

  function n(options) {
    if (options == null ? void 0 : options.predicate) {
      const predicate = options.predicate;
      return (items) => items.reduce((n2, d, i) => predicate(d, i, items) ? n2 + 1 : n2, 0);
    }
    return (items) => items.length;
  }

  function sum(key, options) {
    let keyFn = typeof key === "function" ? key : (d) => d[key];
    if (options == null ? void 0 : options.predicate) {
      const originalKeyFn = keyFn;
      const predicate = options.predicate;
      keyFn = (d, index, array) => predicate(d, index, array) ? originalKeyFn(d, index, array) : 0;
    }
    return (items) => d3Array.fsum(items, keyFn);
  }

  function tally(options) {
    const _tally = (items) => {
      const {name = "n", wt} = options != null ? options : {};
      const summarized = summarize({[name]: wt == null ? n() : sum(wt)})(items);
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
    const _sliceMax = (items) => typeof orderBy === "function" ? arrange(orderBy)(items).slice(-n).reverse() : arrange(desc(orderBy))(items).slice(0, n);
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
      if (!itemsToJoin.length)
        return items;
      const byMap = (options == null ? void 0 : options.by) == null ? autodetectByMap(items, itemsToJoin) : makeByMap(options.by);
      const joinObjectKeys = Object.keys(itemsToJoin[0]);
      const joined = items.flatMap((d) => {
        const matches = itemsToJoin.filter((j) => isMatch(d, j, byMap));
        if (matches.length) {
          return matches.map((j) => ({...d, ...j}));
        }
        const undefinedFill = Object.fromEntries(joinObjectKeys.filter((key) => d[key] == null).map((key) => [key, void 0]));
        return {...d, ...undefinedFill};
      });
      return joined;
    };
    return _leftJoin;
  }

  function fullJoin(itemsToJoin, options) {
    const _fullJoin = (items) => {
      if (!itemsToJoin.length)
        return items;
      if (!items.length)
        return itemsToJoin;
      const byMap = (options == null ? void 0 : options.by) == null ? autodetectByMap(items, itemsToJoin) : makeByMap(options.by);
      const matchMap = new Map();
      const joinObjectKeys = Object.keys(itemsToJoin[0]);
      const joined = items.flatMap((d) => {
        const matches = itemsToJoin.filter((j) => {
          const matched = isMatch(d, j, byMap);
          if (matched) {
            matchMap.set(j, true);
          }
          return matched;
        });
        if (matches.length) {
          return matches.map((j) => ({...d, ...j}));
        }
        const undefinedFill = Object.fromEntries(joinObjectKeys.filter((key) => d[key] == null).map((key) => [key, void 0]));
        return {...d, ...undefinedFill};
      });
      if (matchMap.size < itemsToJoin.length) {
        const leftEmptyObject = Object.fromEntries(Object.keys(items[0]).map((key) => [key, void 0]));
        for (const item of itemsToJoin) {
          if (!matchMap.has(item)) {
            joined.push({...leftEmptyObject, ...item});
          }
        }
      }
      return joined;
    };
    return _fullJoin;
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
    if (processedSelectKeys.length && processedSelectKeys[0][0] === "-") {
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
      if (!processedSelectKeys.length)
        return items;
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
      if (granularity === "second" || granularity === "s" || granularity === "seconds") {
        value.setUTCSeconds(value.getUTCSeconds() + 1 * period);
      } else if (granularity === "minute" || granularity === "min" || granularity === "minutes") {
        value.setUTCMinutes(value.getUTCMinutes() + 1 * period);
      } else if (granularity === "day" || granularity === "d" || granularity === "days") {
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
  function subtract(a, b, nullyZero) {
    return a == null || b == null ? nullyZero ? (a != null ? a : 0) - (b != null ? b : 0) : void 0 : a - b;
  }
  function add(a, b, nullyZero) {
    return a == null || b == null ? nullyZero ? (a != null ? a : 0) + (b != null ? b : 0) : void 0 : a + b;
  }

  var math = /*#__PURE__*/Object.freeze({
    __proto__: null,
    rate: rate,
    subtract: subtract,
    add: add
  });

  function rate$1(numerator, denominator, options) {
    const numeratorFn = typeof numerator === "function" ? numerator : (d) => d[numerator];
    const denominatorFn = typeof denominator === "function" ? denominator : (d) => d[denominator];
    const {predicate, allowDivideByZero} = options != null ? options : {};
    return predicate == null ? (d, index, array) => {
      const denom = denominatorFn(d, index, array);
      const numer = numeratorFn(d, index, array);
      return rate(numer, denom, allowDivideByZero);
    } : (d, index, array) => {
      if (!predicate(d, index, array))
        return void 0;
      const denom = denominatorFn(d, index, array);
      const numer = numeratorFn(d, index, array);
      return rate(numer, denom, allowDivideByZero);
    };
  }

  function fcumsum(items, accessor) {
    let sum = new d3Array.Adder(), i = 0;
    return Float64Array.from(items, (value) => sum.add(+(accessor(value, i++, items) || 0)));
  }
  function mean(items, accessor) {
    let n = 0;
    for (let i = 0; i < items.length; ++i) {
      const value = accessor(items[i], i, items);
      if (+value === value) {
        n += 1;
      }
    }
    return n ? d3Array.fsum(items, accessor) / n : void 0;
  }

  function cumsum(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => fcumsum(items, keyFn);
  }

  function roll(width, rollFn, options) {
    const {partial = false, align = "right"} = options != null ? options : {};
    const halfWidth = Math.floor(width / 2);
    return (items) => {
      return items.map((_, i) => {
        const endIndex = align === "right" ? i : align === "center" ? i + halfWidth : i + width - 1;
        if (!partial && (endIndex - width + 1 < 0 || endIndex >= items.length)) {
          return void 0;
        }
        const startIndex = Math.max(0, endIndex - width + 1);
        const itemsInWindow = items.slice(startIndex, endIndex + 1);
        return rollFn(itemsInWindow, endIndex);
      });
    };
  }

  function lag(key, options) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    const {n = 1, default: defaultValue} = options != null ? options : {};
    return (items) => {
      return items.map((_, i) => {
        const lagItem = items[i - n];
        return lagItem == null ? defaultValue : keyFn(lagItem, i, items);
      });
    };
  }

  function lead(key, options) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    const {n = 1, default: defaultValue} = options != null ? options : {};
    return (items) => {
      return items.map((_, i) => {
        const leadItem = items[i + n];
        return leadItem == null ? defaultValue : keyFn(leadItem, i, items);
      });
    };
  }

  function rowNumber(options) {
    var _a;
    const startAt = (_a = options == null ? void 0 : options.startAt) != null ? _a : 0;
    return (items) => {
      return items.map((_, i) => i + startAt);
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
      const numerator2 = d3Array.fsum(items, numeratorFn);
      const denominator2 = d3Array.fsum(items, denominatorFn);
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

  function nDistinct(key, options = {}) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => {
      const uniques = new Map();
      let count = 0;
      let i = 0;
      for (const item of items) {
        const value = keyFn(item, i++, items);
        if (!uniques.has(value)) {
          if (!options.includeUndefined && value === void 0 || options.includeNull === false && value === null) {
            continue;
          }
          count += 1;
          uniques.set(value, true);
        }
      }
      return count;
    };
  }

  function first(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => items.length ? keyFn(items[0]) : void 0;
  }

  function last(key) {
    const keyFn = typeof key === "function" ? key : (d) => d[key];
    return (items) => items.length ? keyFn(items[items.length - 1]) : void 0;
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
  exports.cumsum = cumsum;
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
  exports.fullJoin = fullJoin;
  exports.fullSeq = fullSeq;
  exports.fullSeqDate = fullSeqDate;
  exports.fullSeqDateISOString = fullSeqDateISOString;
  exports.groupBy = groupBy;
  exports.innerJoin = innerJoin;
  exports.lag = lag;
  exports.last = last;
  exports.lead = lead;
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
  exports.nDistinct = nDistinct;
  exports.negate = negate;
  exports.numRange = numRange;
  exports.pick = select;
  exports.pivotLonger = pivotLonger;
  exports.pivotWider = pivotWider;
  exports.rate = rate$1;
  exports.rename = rename;
  exports.replaceNully = replaceNully;
  exports.roll = roll;
  exports.rowNumber = rowNumber;
  exports.select = select;
  exports.slice = slice;
  exports.sliceHead = sliceHead;
  exports.sliceMax = sliceMax;
  exports.sliceMin = sliceMin;
  exports.sliceSample = sliceSample;
  exports.sliceTail = sliceTail;
  exports.sort = arrange;
  exports.startsWith = startsWith;
  exports.sum = sum;
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
