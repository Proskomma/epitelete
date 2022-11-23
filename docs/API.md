# Classes

<dl>
<dt><a href="#Epitelete">Epitelete</a></dt>
<dd><p>PERF Middleware for Editors in the Proskomma Ecosystem</p>
</dd>
</dl>

# Typedefs

<dl>
<dt><a href="#contentElementPerf">contentElementPerf</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#blockOrGraftPerf">blockOrGraftPerf</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#perfSequence">perfSequence</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#perfDocument">perfDocument</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#bookCode">bookCode</a> : <code>string</code></dt>
<dd></dd>
<dt><a href="#bookHistory">bookHistory</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#history">history</a> : <code>Object.&lt;string, bookHistory&gt;</code></dt>
<dd></dd>
<dt><a href="#Proskomma">Proskomma</a></dt>
<dd><p>Proskomma instance</p>
</dd>
<dt><a href="#PipelineHandler">PipelineHandler</a></dt>
<dd><p>PipelineHandlers instance</p>
</dd>
</dl>

<a name="Epitelete"></a>

# Epitelete
PERF Middleware for Editors in the Proskomma Ecosystem

**Kind**: global class  

* [Epitelete](#Epitelete)
    * [new Epitelete(args)](#new_Epitelete_new)
    * [.history](#Epitelete+history) : [<code>history</code>](#history)
    * [.clearPerf()](#Epitelete+clearPerf) ⇒ <code>void</code>
    * [.sideloadPerf(bookCode, perfDocument)](#Epitelete+sideloadPerf) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
    * [.fetchPerf(bookCode)](#Epitelete+fetchPerf) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
    * [.readPerf(bookCode, [options])](#Epitelete+readPerf) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
    * [.writePerf(bookCode, sequenceId, perfSequence)](#Epitelete+writePerf) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
    * [.checkPerfSequence(perfSequence)](#Epitelete+checkPerfSequence) ⇒ <code>Array.&lt;string&gt;</code>
    * [.localBookCodes()](#Epitelete+localBookCodes) ⇒ <code>Array.&lt;string&gt;</code>
    * [.bookHeaders()](#Epitelete+bookHeaders) ⇒ <code>Object</code>
    * [.canUndo(bookCode)](#Epitelete+canUndo) ⇒ <code>boolean</code>
    * [.canRedo(bookCode)](#Epitelete+canRedo) ⇒ <code>boolean</code>
    * [.undoPerf(bookCode)](#Epitelete+undoPerf) ⇒ <code>Promise.&lt;?perfDocument&gt;</code>
    * [.redoPerf(bookCode)](#Epitelete+redoPerf) ⇒ <code>Promise.&lt;?perfDocument&gt;</code>
    * [.readUsfm(bookCode)](#Epitelete+readUsfm) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.makeDocumentReport(bookCode, reportName, data)](#Epitelete+makeDocumentReport) ⇒ <code>Promise.&lt;array&gt;</code>
    * [.makeDocumentsReport(reportName, data)](#Epitelete+makeDocumentsReport) ⇒ <code>Promise.&lt;object&gt;</code>


* * *

<a name="new_Epitelete_new"></a>

## new Epitelete(args)
**Returns**: [<code>Epitelete</code>](#Epitelete) - Epitelete instance  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| args | <code>Object</code> |  | constructor args |
| [args.proskomma] | [<code>Proskomma</code>](#Proskomma) |  | a proskomma instance |
| args.docSetId | <code>number</code> |  | a docSetId |
| [args.options] | <code>object</code> | <code>{}</code> | setting params |
| [args.options.historySize] | <code>number</code> | <code>10</code> | size of history buffer |


* * *

<a name="Epitelete+history"></a>

## epitelete.history : [<code>history</code>](#history)
**Kind**: instance property of [<code>Epitelete</code>](#Epitelete)  

* * *

<a name="Epitelete+clearPerf"></a>

## epitelete.clearPerf() ⇒ <code>void</code>
Clears docs history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>void</code> - void  

* * *

<a name="Epitelete+sideloadPerf"></a>

## epitelete.sideloadPerf(bookCode, perfDocument) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
Loads given perf into memory

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument) - same sideloaded PERF document  

| Param | Type | Description |
| --- | --- | --- |
| bookCode | <code>string</code> |  |
| perfDocument | [<code>perfDocument</code>](#perfDocument) | PERF document |


* * *

<a name="Epitelete+fetchPerf"></a>

## epitelete.fetchPerf(bookCode) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
Fetches document from proskomma instance

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument) - fetched PERF document  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+readPerf"></a>

## epitelete.readPerf(bookCode, [options]) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
Gets document from memory or fetches it if proskomma is set

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument) - found or fetched PERF document  

| Param | Type | Description |
| --- | --- | --- |
| bookCode | <code>string</code> |  |
| [options] | <code>object</code> |  |
| [options.readPipeline] | <code>string</code> | pipeline name |


* * *

<a name="Epitelete+writePerf"></a>

## epitelete.writePerf(bookCode, sequenceId, perfSequence) ⇒ [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument)
Merges a sequence with the document and saves the new modified document.

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;perfDocument&gt;</code>](#perfDocument) - modified PERF document  

| Param | Type | Description |
| --- | --- | --- |
| bookCode | <code>string</code> |  |
| sequenceId | <code>number</code> | id of modified sequence |
| perfSequence | [<code>perfSequence</code>](#perfSequence) | modified sequence |


* * *

<a name="Epitelete+checkPerfSequence"></a>

## epitelete.checkPerfSequence(perfSequence) ⇒ <code>Array.&lt;string&gt;</code>
?Checks Perf Sequence

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Array.&lt;string&gt;</code> - array of warnings  

| Param | Type |
| --- | --- |
| perfSequence | [<code>perfSequence</code>](#perfSequence) | 


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
**Returns**: <code>Object</code> - an object with book codes as keys, and values
contain book header data  

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

## epitelete.undoPerf(bookCode) ⇒ <code>Promise.&lt;?perfDocument&gt;</code>
Gets previous document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Promise.&lt;?perfDocument&gt;</code> - PERF document or null if can not undo  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+redoPerf"></a>

## epitelete.redoPerf(bookCode) ⇒ <code>Promise.&lt;?perfDocument&gt;</code>
Gets next document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Promise.&lt;?perfDocument&gt;</code> - PERF document or null if can not redo  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+readUsfm"></a>

## epitelete.readUsfm(bookCode) ⇒ <code>Promise.&lt;string&gt;</code>
Gets document from memory and converts it to usfm

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Promise.&lt;string&gt;</code> - converted usfm  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+makeDocumentReport"></a>

## epitelete.makeDocumentReport(bookCode, reportName, data) ⇒ <code>Promise.&lt;array&gt;</code>
Generates and returns a report via a transform pipeline

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Promise.&lt;array&gt;</code> - A report  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 
| reportName | <code>string</code> | 
| data | <code>object</code> | 


* * *

<a name="Epitelete+makeDocumentsReport"></a>

## epitelete.makeDocumentsReport(reportName, data) ⇒ <code>Promise.&lt;object&gt;</code>
Generates and returns a report for each document via a transform pipeline

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: <code>Promise.&lt;object&gt;</code> - reports for each documents with bookCode as the key  

| Param | Type |
| --- | --- |
| reportName | <code>string</code> | 
| data | <code>object</code> | 


* * *

<a name="contentElementPerf"></a>

# contentElementPerf : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>string</code> | 
| [number] | <code>string</code> | 
| [subtype] | <code>&quot;verses&quot;</code> \| <code>&quot;xref&quot;</code> \| <code>&quot;footnote&quot;</code> \| <code>&quot;noteCaller&quot;</code> | 
| [target] | <code>string</code> | 
| [nBlocks] | <code>number</code> | 
| [previewText] | <code>string</code> | 


* * *

<a name="blockOrGraftPerf"></a>

# blockOrGraftPerf : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>&quot;block&quot;</code> \| <code>&quot;graft&quot;</code> | 
| subtype | <code>string</code> | 
| [target] | <code>string</code> | 
| [nBlocks] | <code>number</code> | 
| [previewText] | <code>string</code> | 
| [firstBlockScope] | <code>string</code> | 
| [content] | <code>Array.&lt;(string\|contentElementPerf)&gt;</code> | 


* * *

<a name="perfSequence"></a>

# perfSequence : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>&quot;main&quot;</code> \| <code>&quot;introduction&quot;</code> \| <code>&quot;introTitle&quot;</code> \| <code>&quot;IntroEndTitle&quot;</code> \| <code>&quot;title&quot;</code> \| <code>&quot;endTitle&quot;</code> \| <code>&quot;heading&quot;</code> \| <code>&quot;remark&quot;</code> \| <code>&quot;sidebar&quot;</code> \| <code>&quot;table&quot;</code> \| <code>&quot;tree&quot;</code> \| <code>&quot;kv&quot;</code> \| <code>&quot;footnote&quot;</code> \| <code>&quot;noteCaller&quot;</code> \| <code>&quot;xref&quot;</code> \| <code>&quot;pubNumber&quot;</code> \| <code>&quot;altNumber&quot;</code> \| <code>&quot;esbCat&quot;</code> \| <code>&quot;fig&quot;</code> \| <code>&quot;temp&quot;</code> | 
| [nBlocks] | <code>number</code> | 
| [firstBlockScope] | <code>string</code> | 
| [previewText] | <code>string</code> | 
| selected | <code>boolean</code> | 
| [blocks] | [<code>Array.&lt;blockOrGraftPerf&gt;</code>](#blockOrGraftPerf) | 


* * *

<a name="perfDocument"></a>

# perfDocument : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| headers | <code>object</code> | 
| tags | <code>array</code> | 
| sequences | <code>Object.&lt;string, perfSequence&gt;</code> | 
| mainSequence | <code>string</code> | 


* * *

<a name="bookCode"></a>

# bookCode : <code>string</code>
**Kind**: global typedef  

* * *

<a name="bookHistory"></a>

# bookHistory : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| bookHistory.cursor | <code>number</code> | 
| bookHistory.stack | <code>Array.&lt;Object&gt;</code> | 
| bookHistory.stack[].perfDocument | [<code>perfDocument</code>](#perfDocument) | 
| bookHistory.stack[].pipelineData | <code>Object.&lt;string, any&gt;</code> | 


* * *

<a name="history"></a>

# history : <code>Object.&lt;string, bookHistory&gt;</code>
**Kind**: global typedef  

* * *

<a name="Proskomma"></a>

# Proskomma
Proskomma instance

**Kind**: global typedef  
**See**: [https://github.com/mvahowe/proskomma-js](https://github.com/mvahowe/proskomma-js)  

* * *

<a name="PipelineHandler"></a>

# PipelineHandler
PipelineHandlers instance

**Kind**: global typedef  
**See**: [https://github.com/DanielC-N/pipelineHandler](https://github.com/DanielC-N/pipelineHandler)  

* * *

