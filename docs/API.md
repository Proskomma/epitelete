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
<dt><a href="#sequencePerf">sequencePerf</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#documentPerf">documentPerf</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Proskomma">Proskomma</a></dt>
<dd><p>Proskomma instance</p>
</dd>
</dl>

<a name="Epitelete"></a>

# Epitelete
PERF Middleware for Editors in the Proskomma Ecosystem

**Kind**: global class  

* [Epitelete](#Epitelete)
    * [new Epitelete(args)](#new_Epitelete_new)
    * [.fetchPerf(bookCode)](#Epitelete+fetchPerf) ⇒ [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf)
    * [.readPerf(bookCode)](#Epitelete+readPerf) ⇒ [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf)
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

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| args | <code>Object</code> |  | constructor args |
| [args.proskomma] | [<code>Proskomma</code>](#Proskomma) |  | a proskomma instance |
| args.docSetId | <code>number</code> |  | a docSetId |
| [args.options] | <code>object</code> | <code>{}</code> | setting params |
| [args.options.historySize] | <code>number</code> | <code>3</code> | size of history buffer |


* * *

<a name="Epitelete+fetchPerf"></a>

## epitelete.fetchPerf(bookCode) ⇒ [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf)
Fetches document from proskomma instance

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf) - fetched document PERF  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 


* * *

<a name="Epitelete+readPerf"></a>

## epitelete.readPerf(bookCode) ⇒ [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf)
Gets document from memory or fetches it if proskomma is set

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
**Returns**: [<code>Promise.&lt;documentPerf&gt;</code>](#documentPerf) - found or fetched document PERF  

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
| sequenceId | <code>number</code> | id of modified sequence |
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

<a name="contentElementPerf"></a>

# contentElementPerf : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>string</code> | 
| [number] | <code>string</code> | 
| [subType] | <code>&quot;verses&quot;</code> \| <code>&quot;xref&quot;</code> \| <code>&quot;footnote&quot;</code> \| <code>&quot;noteCaller&quot;</code> | 
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
| subType | <code>string</code> | 
| [target] | <code>string</code> | 
| [nBlocks] | <code>number</code> | 
| [previewText] | <code>string</code> | 
| [firstBlockScope] | <code>string</code> | 
| [content] | <code>Array.&lt;(string\|contentElementPerf)&gt;</code> | 


* * *

<a name="sequencePerf"></a>

# sequencePerf : <code>object</code>
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

<a name="documentPerf"></a>

# documentPerf : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| headers | <code>object</code> | 
| tags | <code>array</code> | 
| sequences | <code>Object.&lt;string, sequencePerf&gt;</code> | 
| mainSequence | <code>string</code> | 


* * *

<a name="Proskomma"></a>

# Proskomma
Proskomma instance

**Kind**: global typedef  
**See**: [https://github.com/mvahowe/proskomma-js](https://github.com/mvahowe/proskomma-js)  

* * *

