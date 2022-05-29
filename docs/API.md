# Classes

<dl>
<dt><a href="#Epitelete">Epitelete</a></dt>
<dd><p>PERF Middleware for Editors in the Proskomma Ecosystem</p>
</dd>
</dl>

# Typedefs

<dl>
<dt><a href="#documentPerf">documentPerf</a> : <code>Object.&lt;string, Object&gt;</code></dt>
<dd></dd>
<dt><a href="#sequencePerf">sequencePerf</a> : <code>Object.&lt;string, Object&gt;</code></dt>
<dd></dd>
</dl>

<a name="Epitelete"></a>

# Epitelete
PERF Middleware for Editors in the Proskomma Ecosystem

**Kind**: global class  

* [Epitelete](#Epitelete)
    * [new Epitelete(args)](#new_Epitelete_new)
    * [.fetchPerf(bookCode)](#Epitelete+fetchPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.readPerf(bookCode)](#Epitelete+readPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.writePerf(bookCode, sequenceId, perfSequence)](#Epitelete+writePerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.checkPerfSequence(perfSequence)](#Epitelete+checkPerfSequence) ⇒ <code>Array.&lt;string&gt;</code>
    * [.localBookCodes()](#Epitelete+localBookCodes) ⇒ <code>Array.&lt;string&gt;</code>
    * [.bookHeaders()](#Epitelete+bookHeaders) ⇒ <code>Object</code>
    * [.clearPerf()](#Epitelete+clearPerf) ⇒ <code>void</code>
    * [.canUndo(bookCode)](#Epitelete+canUndo) ⇒ <code>boolean</code>
    * [.canRedo(bookCode)](#Epitelete+canRedo) ⇒ <code>boolean</code>
    * [.undoPerf(bookCode)](#Epitelete+undoPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.redoPerf(bookCode)](#Epitelete+redoPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.sideloadPerf(bookCode, perfJSON)](#Epitelete+sideloadPerf) ⇒ [<code>documentPerf</code>](#documentPerf)


* * *

<a name="new_Epitelete_new"></a>

## new Epitelete(args)
**Returns**: [<code>Epitelete</code>](#Epitelete) - Epitelete instance  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | constructor args |
| [args.proskomma] | <code>UWProskomma</code> | a proskomma instance |
| args.docSetId | <code>integer</code> | a docSetId |
| [args.options] | <code>Object</code> | setting params |
| [args.options.historySize] | <code>integer</code> | size of history buffer |


* * *

<a name="Epitelete+fetchPerf"></a>

## epitelete.fetchPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Fetches document from proskomma instance

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - fetched document PERF  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+readPerf"></a>

## epitelete.readPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets document from memory or fetches it if proskomma is set

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - found or fetched document PERF  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+writePerf"></a>

## epitelete.writePerf(bookCode, sequenceId, perfSequence) ⇒ [<code>documentPerf</code>](#documentPerf)
Merges a sequence with the document and saves the new modified document.

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - modified document PERF  

| Param | Type | Description |
| --- | --- | --- |
| bookCode | <code>string</code> |  |
| sequenceId | <code>integer</code> | id of modified sequence |
| perfSequence | [<code>sequencePerf</code>](#sequencePerf) | modified sequence |


* * *

<a name="Epitelete+checkPerfSequence"></a>

## epitelete.checkPerfSequence(perfSequence) ⇒ <code>Array.&lt;string&gt;</code>
?Checks Perf Sequence

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Array.&lt;string&gt;</code> - array of warnings  

| Param | Type |
| --- | --- |
| perfSequence | [<code>sequencePerf</code>](#sequencePerf) | 


* * *

<a name="Epitelete+localBookCodes"></a>

## epitelete.localBookCodes() ⇒ <code>Array.&lt;string&gt;</code>
Get array of book codes from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Array.&lt;string&gt;</code> - array of bookCodes  

* * *

<a name="Epitelete+bookHeaders"></a>

## epitelete.bookHeaders() ⇒ <code>Object</code>
Gets the available books for current docSet.

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Object</code> - an object with book codes as keys, and valuescontain book header data  

* * *

<a name="Epitelete+clearPerf"></a>

## epitelete.clearPerf() ⇒ <code>void</code>
Clears docs history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>void</code> - void  

* * *

<a name="Epitelete+canUndo"></a>

## epitelete.canUndo(bookCode) ⇒ <code>boolean</code>
Checks if able to undo from specific book history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+canRedo"></a>

## epitelete.canRedo(bookCode) ⇒ <code>boolean</code>
Checks if able to redo from specific book history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+undoPerf"></a>

## epitelete.undoPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets previous document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - document PERF or null if can not undo  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+redoPerf"></a>

## epitelete.redoPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets next document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - document PERF or null if can not redo  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+sideloadPerf"></a>

## epitelete.sideloadPerf(bookCode, perfJSON) ⇒ [<code>documentPerf</code>](#documentPerf)
Loads given perf into memory

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>documentPerf</code>](#documentPerf) - same sideloaded document PERF  

| Param | Type | Description |
| --- | --- | --- |
| bookCode | <code>string</code> |  |
| perfJSON | [<code>documentPerf</code>](#documentPerf) | document PERF |


* * *

<a name="documentPerf"></a>

# documentPerf : <code>Object.&lt;string, Object&gt;</code>
**Kind**: global typedef  

* * *

<a name="sequencePerf"></a>

# sequencePerf : <code>Object.&lt;string, Object&gt;</code>
**Kind**: global typedef  

* * *

