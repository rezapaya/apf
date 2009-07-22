/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

var __MULTISELECT__ = 1 << 8;

// #ifdef __WITH_MULTISELECT

/**
 * @term traversenode A traverse node is a {@link term.datanode data node} that is in the set selected by the 
 * {@link baseclass.multiselectbinding.binding.traverse traverse binding rule}.
 * These {@link term.datanode data nodes} get representation within the visual element. For instance
 * each item in a list is connected to such a traverse node. A traverse node
 * can be selected, removed, added, dragged, dropped and so on. 
 * Example:
 * In this example the person nodes that have the show attribute set to 1 are the 
 * traverse nodes of the list. This list will display three items.
 * <code>
 *  <a:list>
 *      <a:bindings>
 *          <a:caption select="@name" />
 *          <a:traverse select="person[@show='1']" />
 *      </a:bindings>
 *      <a:model>
 *          <data>
 *              <person name="test 5"/>
 *              <person show="1" name="test 3"/>
 *              <person name="test 4"/>
 *              <person show="1" name="test 2"/>
 *              <person show="1" name="test 1"/>
 *          </data>
 *      </a:model>
 *  </a:list>
 * </code>
 * Remarks:
 * A somewhat advanced topic is understanding how an element can use the 
 * traverse {@link term.binding binding rule}. For the tree this binding rules
 * can be used to create a virtual tree mapping of the xml.
 */

/**
 * @term caret When selecting nodes in a list using the keyboard, the caret is 
 * the indication of the position within that list. The item that the caret is
 * on might or might not be selected. This feature is especially useful when 
 * holding the control key or using the shift key to multi select items.
 */

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have selection features. This includes handling
 * for multiselect and several keyboard based selection interaction. It also
 * takes care of {@link term.caret caret} handling when multiselect is enabled. Furthermore features 
 * for dealing with multinode component are included like adding and removing 
 * {@link term.datanode data nodes}.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 *
 * @inherits apf.MultiselectBinding
 *
 * @binding select Determines whether the {@link term.traversenode traverse node} can be selected.
 * Example:
 * In this example the tree contains nodes that have a disabled flag set. 
 * These nodes cannot be selected
 * <code>
 *  <a:tree>
 *      <a:bindings>
 *          <a:select select="self::node()[not(@disabled)]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * @binding value  Determines the way the value for the element is retrieved
 * from the selected node. The value property contains this value.
 * Example:
 * <code>
 *  <a:dropdown onafterchange="alert(this.value)">
 *      <a:bindings>
 *          <a:caption select="text()" />
 *          <a:value select="@value" />
 *          <a:traverse select="item" />
 *      </a:bindings>
 *      <a:model>
 *          <items>
 *              <item value="#FF0000">red</item>
 *              <item value="#00FF00">green</item>
 *              <item value="#0000FF">blue</item>
 *          </items>
 *      </a:model>
 *  </a:dropdown>
 * </code>
 */
apf.MultiSelect = function(){
    var noEvent;
    var selSmartbinding;
    var valueList    = [];
    var selectedList = [];
    var _self        = this;

    this.$regbase    = this.$regbase|__MULTISELECT__;

    /**** Properties ****/

    /**
     * the last selected item of this element.
     * @type {XMLElement} 
     */
    this.sellength    = 0;
    this.selected     = null;
    this.$selected    = null;
    
    /**
     * the xml element that has the {@link term.caret caret}.
     * @type {XMLElement} 
     */
    this.indicator    = null;
    this.$indicator   = null;
    
    /**
     * whether to use a {@link term.caret caret} in the interaction of this element.
     * @type {Boolean} 
     */
    this.useindicator = true;

    // #ifdef __WITH_DATABINDING

    /**
     * Removes an {@link term.datanode data node} from the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <a:list id="myList">
     *      <a:bindings>
     *          <a:caption select="@name" />
     *          <a:value select="@id" />
     *          <a:icon>{@type}.png</a:icon>
     *          <a:traverse select="product" />
     *      </a:bindings>
     *      <a:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </a:model>
     *  </a:list>
     * </code>
     * Example:
     * This example selects a product by it's value and then removes the
     * selection.
     * <code>
     *  myList.setValue("product20");
     *  myList.remove();
     * </code>
     * Example:
     * This example gets a product by it's value and then removes it.
     * <code>
     *  var xmlNode = myList.findXmlNodeByValue("product20");
     *  myList.remove(xmlNode);
     * </code>
     * Example:
     * This example retrieves all nodes from a list. All items with a length
     * greater than 10 are singled out and removed.
     * <code>
     *  var list = myList.getTraverseNodes(); //get all nodes from a list.
     *  var removeList = [];
     *  for (var i = 0; i < list.length; i++) {
     *      if (list[i].getAttribute("length") > 10)
     *          removeList.push(list[i]);
     *  }
     *  myList.remove(removeList); //remove the list of nodes
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <a:button action="remove" target="myList">Remove item</a:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user removed an item.
     * <code>
     *  <a:actions>
     *      <a:remove set="url:remove_product.php?id={@id}" />
     *  </a:actions>
     * </code>
     * For undo this action should be extended and the server should maintain a
     * copy of the deleted item.
     * <code>
     *  <a:actions>
     *      <a:remove set  = "url:remove_product.php?id={@id}"
     *                undo = "url:undo_remove_product.php?id={@id}" />
     *      </a:remove>
     *  </a:actions>
     * </code>
     * @action
     * @param  {mixed} [nodeList]  the {@link term.datanode data node}(s) to be removed. If none are specified, the current selection is removed.
     *   Possible values:
     *   {NodeList}   the {@link term.datanode data nodes} to be removed.
     *   {XMLElement} the {@link term.datanode data node} to be removed.
     * @return  {Boolean}  specifies if the removal succeeded
     */
    this.remove = function(nodeList){
        //Use the current selection if no xmlNode is defined
        if (!nodeList)
            nodeList = valueList;

        //If we're an xml node let's convert
        if (nodeList.nodeType)
            nodeList = [nodeList];

        //If there is no selection we'll exit, nothing to do
        if (!nodeList || !nodeList.length)
            return;

        //#ifdef __DEBUG
        //We're not removing the XMLRoot, that would be suicide ;)
        if (nodeList.contains(this.xmlRoot)) {
            throw new Error(apf.formatErrorString(0,
                "Removing nodes",
                "You are trying to delete the xml root of this \
                 element. This is not allowed."));
        }
        //#endif

        var multiple, changes = [];
        for (var i = 0; i < nodeList.length; i++) {
            changes.push({
                func : "removeNode",
                args : [nodeList[i]]
            });
        }
        
        if (this.actionRules && this.actionRules["removegroup"])
            return this.executeAction("multicall", changes, "removegroup", nodeList[0]);
        else {
            return this.executeAction("multicall", changes, "remove", 
              nodeList[0], null, null, nodeList.length > 1 ? nodeList : null);
        }
    };

    /**
     * Adds an {@link term.datanode data node} to the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <a:list id="myList">
     *      <a:bindings>
     *          <a:caption select="@name" />
     *          <a:value select="@id" />
     *          <a:icon>{@type}.png</a:icon>
     *          <a:traverse select="product" />
     *      </a:bindings>
     *      <a:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </a:model>
     *  </a:list>
     * </code>
     * Example:
     * This example adds a product to this element.
     * selection.
     * <code>
     *  myList.add('<product name="USB drive" type="storage" />');
     * </code>
     * Example:
     * This example copy's the selected product, changes it's name and then
     * adds it. After selecting the new node the user is offered a rename input
     * box.
     * <code>
     *  var xmlNode = apf.xmldb.copy(myList.selected);
     *  xmlNode.setAttribute("name", "New product");
     *  myList.add(xmlNode);
     *  myList.select(xmlNode);
     *  myList.startRename();
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <a:button action="add" target="myList">Add new product</a:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user added an item.
     * <code>
     *  <a:actions>
     *      <a:add set="rpc:comm.addProduct({.})" />
     *  </a:actions>
     * </code>
     * For undo this action should be extended as follows.
     * <code>
     *  <a:actions>
     *      <a:add set  = "url:add_product.php?xml={.}"
     *             undo = "url:remove_product.php?id={@id}" />
     *      </a:add>
     *  </a:actions>
     * </code>
     * In some cases the server needs to create the new product before it's
     * added. This is done as follows.
     * <code>
     *  <a:actions>
     *      <a:add get="rpc:comm.createNewProduct()" />
     *  </a:actions>
     * </code>
     * Alternatively the template for the addition can be provided as a child of
     * the action rule.
     * <code>
     *  <a:actions>
     *      <a:add set="url:add_product.php?xml={.}">
     *          <product name="USB drive" type="storage" />
     *      </a:add>
     *  </a:actions>
     * </code>
     * @action
     * @param  {XMLElement} [xmlNode]    the {@link term.datanode data node} which is added. If none is specified the action will use the action rule to try to retrieve a new node to add.
     * @param  {XMLElement} [pNode]      the parent node of the added {@link term.datanode data node}.
     * @param  {XMLElement} [beforeNode] the position where the xml element should be inserted.
     * @return  {XMLElement} the added {@link term.datanode data node} or false on failure.
     */
    this.add = function(xmlNode, pNode, beforeNode){
        var node;

        if (this.actionRules) {
            if (xmlNode && xmlNode.nodeType)
                node = this.getNodeFromRule("add", xmlNode, true);
            else if (typeof xmlNode == "string") {
                if (xmlNode.trim().charAt(0) == "<") {
                    xmlNode = apf.getXml(xmlNode);
                    node = this.getNodeFromRule("add", xmlNode, true);
                }
                else {
                    var rules = this.actionRules["add"];
                    for (var i = 0, l = rules.length; i < l; i++) {
                        if (rules[i].getAttribute("type") == xmlNode) {
                            xmlNode = null;
                            node = rules[i];
                            break;
                        }
                    }
                }
            }

            if (!node && this.actionRules["add"])
                node = this.actionRules["add"][0];
        }
        else
            node = null;

        //#ifdef __WITH_OFFLINE
        var bHasOffline = (typeof apf.offline != "undefined");
        if (bHasOffline && !apf.offline.canTransact())
            return false;

        if (bHasOffline && !apf.offline.onLine && (!xmlNode || !node.getAttribute("get")))
            return false;
        //#endif
        
        var refNode  = this.isTreeArch ? this.selected || this.xmlRoot : this.xmlRoot;
        var amlNode  = this; //PROCINSTR
        var callback = function(addXmlNode, state, extra){
            if (state != apf.SUCCESS) {
                var oError;

                oError = new Error(apf.formatErrorString(1032, amlNode,
                    "Loading xml data",
                    "Could not add data for control " + amlNode.name
                    + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                    + "\nInfo: " + extra.message + "\n\n" + xmlNode));

                if (extra.tpModule.retryTimeout(extra, state, amlNode, oError) === true)
                    return true;

                throw oError;
            }

            if (typeof addXmlNode != "object")
                addXmlNode = apf.getXmlDom(addXmlNode).documentElement;
            if (addXmlNode.getAttribute(apf.xmldb.xmlIdTag))
                addXmlNode.setAttribute(apf.xmldb.xmlIdTag, "");

            var actionNode = amlNode.getNodeFromRule("add", amlNode.isTreeArch
                ? amlNode.selected
                : amlNode.xmlRoot, true, true);
            if (!pNode) {
                if (actionNode && actionNode.getAttribute("parent")) {
                    pNode = amlNode.xmlRoot
                        .selectSingleNode(actionNode.getAttribute("parent"));
                }
                else {
                    pNode = amlNode.isTreeArch
                        ? amlNode.selected || amlNode.xmlRoot
                        : amlNode.xmlRoot
                }
            }

            if (!pNode)
                pNode = amlNode.xmlRoot;

            if (apf.isSafari && pNode.ownerDocument != addXmlNode.ownerDocument)
                addXmlNode = pNode.ownerDocument.importNode(addXmlNode, true); //Safari issue not auto importing nodes

            if (amlNode.executeAction("appendChild",
              [pNode, addXmlNode, beforeNode], "add", addXmlNode) !== false
              && amlNode.autoselect)
                amlNode.select(addXmlNode);

            return addXmlNode;
        }

        if (xmlNode)
            return callback(xmlNode, apf.SUCCESS);
        else {
            //#ifdef __DEBUG
            if (!node) {
                throw new Error(apf.formatErrorString(0, this,
                    "Executing add action",
                    "Missing add action defined in action rules. Unable to \
                     perform action."));
            }
            //#endif

            if (node.getAttribute("get"))
                return apf.getData(node.getAttribute("get"), refNode, null, callback)
            else if (node.firstChild) {
                var node = apf.getNode(node, [0]);
                if (apf.supportNamespaces && node.namespaceURI == apf.ns.xhtml) {
                    node = apf.getXml(node.xml.replace(/xmlns\=\"[^"]*\"/g, ""));
                    //@todo import here for webkit?
                }
                else node = node.cloneNode(true);
                
                return callback(node, apf.SUCCESS);
            }
        }

        return addXmlNode;
    };

    if (!this.setValue) {
        /**
         * Sets the value of this element.The value
         * corresponds to an item in the list of loaded {@link term.datanode data nodes}. This
         * element will receive the selection. If no {@link term.datanode data node} is found, the
         * selection is cleared.
         *
         * @param  {String}  value  the new value for this element.
         * @param  {Boolean} disable_event
         * @see baseclass.multiselect.method.getValue
         */
        this.setValue = function(value, disable_event){
            noEvent = disable_event;
            this.setProperty("value", value);
            noEvent = false;
        };
    }

    /**
     * Retrieves an {@link term.datanode data node} that has a value that corresponds to the
     * string that is searched on.
     * @param {String} value the value to match.
     */
    this.findXmlNodeByValue = function(value){
        var nodes = this.getTraverseNodes();
        var bindSet = this.bindingRules && this.bindingRules[this.mainBind]
            ? this.mainBind
            : (this.valuerule ? "value" : "caption");

        for (var i = 0; i < nodes.length; i++) {
            if (this.applyRuleSetOnNode(bindSet, nodes[i]) == value)
                return nodes[i];
        }
    };

    if (!this.getValue) {
        /**
         * Retrieves the value of this element. This is the value of the
         * first selected {@link term.datanode data node}.
         * @see #setValue
         */
        this.getValue = function(xmlNode, noError){
            if (!this.bindingRules && !this.caption) 
                return false;

            // #ifdef __DEBUG
            if (!this.caption && !this.bindingRules[this.mainBind] && !this.bindingRules["caption"]) {
                /*apf.console.warn("Trying to get value for " 
                    + this.tagName + (this.name ? " [" + this.name + "]" : "") 
                    + ". No value rule has been defined. There is no way \
                       to determine the value of the selected item.");
                return false;*/
                
                if (noError)
                    return false;
                
                throw new Error(apf.formatErrorString(1074, this,
                    "Retrieving the value of this component.",
                    "No value rule has been defined. There is no way \
                     to determine the value of the selected item."));
            }
            // #endif

            // #ifdef __WITH_MULTIBINDING
            if (!this.multiselect && !this.xmlRoot && selSmartbinding && selSmartbinding.xmlRoot)
                return selSmartbinding.applyRuleSetOnNode(selSmartbinding.mainBind,
                    selSmartbinding.xmlRoot, null, true);
            // #endif

            return this.applyRuleSetOnNode(this.mainBind, xmlNode || this.selected, null, true)
                || this.applyRuleSetOnNode("caption", xmlNode || this.selected, null, true);

        };
    }
    // #ifdef __WITH_MULTIBINDING
    /**
     * Sets the second level SmartBinding for Multilevel Databinding.
     * For more information see {@link baseclass.multilevelbinding}
     *
     * @return  {SmartBinding}
     * @see baseclass.multiselect.method.getSelectionBindClass
     * @private
     */
    this.$setMultiBind = function(smartbinding, part){
        if (!selSmartbinding)
            selSmartbinding = new apf.MultiLevelBinding(this);

        selSmartbinding.setSmartBinding(smartbinding, part);

        this.dispatchEvent("initselbind", {smartbinding : selSmartbinding});
    };
    
    /**
     * Gets the {@link baseclass.multilevelbinding} for this element.
     * @return {MultiLevelBinding} the {@link baseclass.multilevelbinding} for this element.
     * @private
     */
    this.getMultibinding = function(){
        return selSmartbinding;
    }
    // #endif
    // #ifdef __WITH_MULTIBINDING
    /**
     * Gets the second level SmartBinding for Multilevel Databinding.
     * For more information see {@link baseclass.multilevelbinding}
     *
     * @return  {SmartBinding}
     * @see baseclass.multiselect.method.setSelectionBindClass
     * @private
     */
    this.$getMultiBind = function(){
        return (selSmartbinding
            || (selSmartbinding = new apf.MultiLevelBinding(this)));
    };
    // #endif
    // #endif

    /**
     * Select the current selection again.
     *
     * @todo Add support for multiselect
     */
    this.reselect = function(){
        if (this.selected) this.select(this.selected, null, this.ctrlselect,
            null, true);//no support for multiselect currently.
    };

    /**
     * Selects a single, or set of {@link term.traversenode traverse nodes}.
     * The selection can be visually represented in this element.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *   Possible values:
     *   {XMLElement}  the {@link term.datanode data node} to be used in the selection as a start/end point or to toggle the selection on the node.
     *   {HTMLElement} the html element node used as visual representation of {@link term.datanode data node}. Used to determine the {@link term.datanode data node} for selection.
     *   {String}      the value of the {@link term.datanode data node} to be select.
     * @param {Boolean} [ctrlKey]    whether the Ctrl key was pressed
     * @param {Boolean} [shiftKey]   whether the Shift key was pressed
     * @param {Boolean} [fakeselect] whether only visually a selection is made
     * @param {Boolean} [force]      whether reselect is forced.
     * @param {Boolean} [noEvent]    whether to not call any events
     * @return  {Boolean}  whether the selection could be made
     *
     * @event  beforeselect  Fires before a {@link baseclass.multiselect.method.select selection} is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that will be selected.
     *   {HTMLElement} htmlNode the html element that visually represents the {@link term.datanode data node}.
     * @event  afterselect  Fires after a {@link baseclass.multiselect.method.select selection} is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that was selected.
     *   {HTMLElement} htmlNode the html element that visually represents the {@link term.datanode data node}.
     */
    var buffered = null;
    this.select  = function(xmlNode, ctrlKey, shiftKey, fakeselect, force, noEvent){
        if (!this.selectable || this.disabled) return;

        if (this.$skipSelect) {
            this.$skipSelect = false;
            return;
        }

        if (this.ctrlselect && !shiftKey)
            ctrlKey = true;

        if (!this.multiselect)
            ctrlKey = shiftKey = false;
        
        // Selection buffering (for async compatibility)
        if (!this.xmlRoot) {
            buffered        = [arguments, this.autoselect];
            this.autoselect = true;
            return;
        }

        if (buffered) {
            var x    = buffered;
            buffered = null;
            if (this.autoselect)
                this.autoselect = x[1];
            return this.select.apply(this, x[0]);
        }

        var htmlNode;

        /* **** Type Detection *****/
        if (!xmlNode) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(1075, this,
                "Making a selection",
                "No selection was specified"))
            //#endif

            return false;
        }

        if (typeof xmlNode != "object") {
            var str = xmlNode;
            xmlNode = apf.xmldb.getNodeById(xmlNode);

            //Select based on the value of the xml node
            if (!xmlNode) {
                xmlNode = this.findXmlNodeByValue(str);
                if (!xmlNode) {
                    this.clearSelection(null, noEvent);
                    return;
                }
            }
        }
        
        if (!xmlNode.style)
            htmlNode = this.caching
                ? this.getNodeFromCache(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
        else {
            var id = (htmlNode = xmlNode).getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    apf.xmldb.htmlIdTag);

            xmlNode = apf.xmldb.getNodeById(id, this.xmlRoot);
        }

        if(this.dispatchEvent('beforeselect', {
            xmlNode     : xmlNode,
            htmlNode    : htmlNode,
            ctrlKey     : ctrlKey,
            shiftKey    : shiftKey,
            force       : force,
            captureOnly : noEvent
        }) === false)
              return false;

        /**** Selection ****/

        var lastIndicator = this.indicator;
        this.indicator    = xmlNode;

        //Multiselect with SHIFT Key.
        if (shiftKey) {
            var range = this.$calcSelectRange(valueList[0] || lastIndicator,
                xmlNode);

            if (this.$indicator)
                this.$deindicate(this.$indicator);

            this.selectList(range);

            this.$selected  =
            this.$indicator = this.$indicate(htmlNode);
        }
        else if (ctrlKey) { //Multiselect with CTRL Key.
            //Node will be unselected
            if (valueList.contains(xmlNode)) {
                if (this.selected == xmlNode) {
                    var ind = this.$indicator;
                    this.clearSelection(true, true);
                    this.$deindicate(ind);

                    if (valueList.length && !fakeselect) {
                        //this.$selected = selectedList[0];
                        this.selected = valueList[0];
                    }
                }
                else
                    this.$deselect(htmlNode, xmlNode);

                if (!fakeselect) {
                    selectedList.remove(htmlNode);
                    valueList.remove(xmlNode);
                }

                if (htmlNode != this.$indicator)
                    this.$deindicate(this.$indicator);

                this.$selected  =
                this.$indicator = this.$indicate(htmlNode);
            }
            // Node will be selected
            else {
                if (this.$indicator)
                    this.$deindicate(this.$indicator);
                this.$indicator = this.$indicate(htmlNode);

                this.$selected   = this.$select(htmlNode);
                this.selected     = xmlNode;

                if (!fakeselect) {
                    selectedList.push(htmlNode);
                    valueList.push(xmlNode);
                }
            }
        }
        else if (htmlNode && selectedList.contains(htmlNode) && fakeselect) //Return if selected Node is htmlNode during a fake select
            return;
        else { //Normal Selection
            if (!force && htmlNode && this.$selected == htmlNode
              && valueList.length <= 1 && !this.reselectable
              && selectedList.contains(htmlNode))
                return;

            if (this.$selected)
                this.$deselect(this.$selected);
            if (this.$indicator)
                this.$deindicate(this.$indicator);
            if (this.selected)
                this.clearSelection(null, true);

            this.$indicator = this.$indicate(htmlNode, xmlNode);
            this.$selected  = this.$select(htmlNode, xmlNode);
            this.selected    = xmlNode;

            selectedList.push(htmlNode);
            valueList.push(xmlNode);
        }

        if (this.delayedselect && (typeof ctrlKey == "boolean")){
            var jNode = this;
            setTimeout(function(){
                jNode.dispatchEvent("afterselect", {
                    list        : valueList,
                    xmlNode     : xmlNode,
                    captureOnly : noEvent
                });
            }, 10);
        }
        else
            this.dispatchEvent("afterselect", {
                list        : valueList,
                xmlNode     : xmlNode,
                captureOnly : noEvent
            });

        return true;
    };

    /**
     * Choose a selected item. This is done by double clicking on the item or
     * pressing the Enter key.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *   Possible values:
     *   {XMLElement}  the {@link term.datanode data node} to be choosen.
     *   {HTMLElement} the html element node used as visual representation of {@link term.datanode data node}. Used to determine the {@link term.datanode data node}.
     *   {String}      the value of the {@link term.datanode data node} to be choosen.
     * @event  beforechoose  Fires before a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that was choosen.
     * @event  afterchoose   Fires after a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that was choosen.
     */
    this.choose = function(xmlNode){
        if (!this.selectable || this.disabled) return;

        if (this.dispatchEvent("beforechoose", {xmlNode : xmlNode}) === false)
            return false;

        if (xmlNode && !xmlNode.style)
            this.select(xmlNode);

        if (this.hasFeature(__DATABINDING__)
          && this.dispatchEvent("afterchoose", {xmlNode : this.selected}) !== false)
            this.setConnections(this.selected, "choice");
    };

    /**
     * Removes the selection of one or more selected nodes.
     *
     * @param {Boolean} [singleNode] whether to only deselect the indicated node
     * @param {Boolean} [noEvent]    whether to not call any events
     * @event  beforedeselect  Fires before a {@link baseclass.multiselect.method.choose choice} is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that will be deselected.
     * @event  afterdeselect   Fires after a {@link baseclass.multiselect.method.choose choice} is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that is deselected.
     */
    this.clearSelection = function(singleNode, noEvent){
        if (!this.selectable || this.disabled || !valueList.length) 
            return;

        var clSel = singleNode ? this.selected : valueList;
        if (!noEvent && this.dispatchEvent("beforedeselect", {
            xmlNode : clSel
          }) === false)
            return false;

        var htmlNode;
        if (this.selected) {
            htmlNode = this.caching
                ? this.getNodeFromCache(this.selected.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(this.selected.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
            this.$deselect(htmlNode);
        }

        //if(this.$selected) this.$deselect(this.$selected);
        this.$selected = this.selected = null;

        if (!singleNode) {
            for (var i = valueList.length - 1; i >= 0; i--) {
                htmlNode = this.caching
                    ? this.getNodeFromCache(valueList[i].getAttribute(
                        apf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                    : document.getElementById(valueList[i].getAttribute(
                        apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
                this.$deselect(htmlNode);
            }
            //for(var i=selectedList.length-1;i>=0;i--) this.$deselect(selectedList[i]);
            selectedList = [];
            valueList    = [];
        }

        if (this.indicator) {
            htmlNode = this.caching
                ? this.getNodeFromCache(this.indicator.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(this.indicator.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55

            //this.$selected  =
            this.$indicator = this.$indicate(htmlNode);
        }

        if (!noEvent) {
            this.dispatchEvent("afterdeselect", {xmlNode : clSel});
        
            //#ifdef __WITH_PROPERTY_BINDING
            if (this.value)
                this.setProperty("value", "");
            
            //@todo inconsistent because setting this is in event callback
            if (this.sellength != valueList.length)
                this.setProperty("sellength", valueList.length);
            //#endif
        }
    };

    /**
     * Selects a set of items
     *
     * @param {Array} xmlNodeList the {@link term.datanode data nodes} that will be selected.
     */
    //@todo I think there are missing events here?
    this.selectList = function(xmlNodeList, noEvent, selected){
        if (!this.selectable || this.disabled) return;

        if (this.dispatchEvent("beforeselect", {
            xmlNode     : selected,
            captureOnly : noEvent
          }) === false)
            return false;

        this.clearSelection(null, true);

        for (var sel, i=0;i<xmlNodeList.length;i++) {
            if (!xmlNodeList[i] || xmlNodeList[i].nodeType != 1) continue; //@todo fix select state in unserialize after removing
            var htmlNode, xmlNode = xmlNodeList[i];

            //Type Detection
            if (typeof xmlNode != "object")
                xmlNode = apf.xmldb.getNodeById(xmlNode);
            if (!xmlNode.style)
                htmlNode = this.$findNode(null, xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
            else {
                htmlNode = xmlNode;
                xmlNode  = apf.xmldb.getNodeById(htmlNode.getAttribute(
                    apf.xmldb.htmlIdTag));
            }

            if (!xmlNode) {
                // #ifdef __DEBUG
                apf.console.warn("Component : " + this.name + " ["
                    + this.tagName + "]\nMessage : xmlNode whilst selecting a list of xmlNodes could not be found. Ignoring.")
                // #endif
                continue;
            }

            //Select Node
            if (htmlNode) {
                if (!sel && selected == htmlNode)
                    sel = htmlNode;

                this.$select(htmlNode);
                selectedList.push(htmlNode);
            }
            valueList.push(xmlNode);
        }

        this.$selected = sel || selectedList[0];
        this.selected   = selected || valueList[0];

        this.dispatchEvent("afterselect", {
            list        : valueList,
            xmlNode     : this.selected,
            captureOnly : noEvent
        });
    };

    /**
     * Sets the {@link term.caret caret} on an item to indicate to the user that the keyboard
     * actions are done relevant to that item. Using the keyboard
     * a user can change the position of the indicator using the Ctrl and arrow
     * keys while not making a selection. When making a selection with the mouse
     * or keyboard the indicator is always set to the selected node. Unlike a
     * selection there can be only one indicator item.
     *
     * @param {mixed}   xmlNode      the identifier to determine the indicator.
     *   Possible values:
     *   {XMLElement}  the {@link term.datanode data node} to be set as indicator.
     *   {HTMLElement} the html element node used as visual representation of {@link term.datanode data node}. Used to determine the {@link term.datanode data node}.
     *   {String}      the value of the {@link term.datanode data node} to be set as indicator.
     * @event indicate Fires when an item becomes the indicator.
     */
    this.setIndicator = function(xmlNode){
        if (!xmlNode) {
            if (this.$indicator)
                this.$deindicate(this.$indicator);
            this.indicator  =
            this.$indicator = null;
            return;
        }

        /* **** Type Detection *****/
        var htmlNode;
        if (typeof xmlNode != "object")
            xmlNode = apf.xmldb.getNodeById(xmlNode);
        if (!xmlNode.style)
            htmlNode = this.caching
                ? this.getNodeFromCache(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
        else {
            var id = (htmlNode = xmlNode).getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    apf.xmldb.htmlIdTag);

            xmlNode = apf.xmldb.getNodeById(id);
        }

        if (this.$indicator)
            this.$deindicate(this.$indicator);
        this.indicator  = xmlNode;
        this.$indicator = this.$indicate(htmlNode);

        this.dispatchEvent("indicate");
    };

    /**
     * @private
     */
    this.setTempSelected = function(xmlNode, ctrlKey, shiftKey){
        clearTimeout(this.timer);

        if (!this.multiselect)
            ctrlKey = shiftKey = false;

        if (ctrlKey || this.ctrlselect) {
            if (this.$tempsel) {
                this.select(this.$tempsel);
                this.$tempsel = null;
            }

            this.setIndicator(xmlNode);
        }
        else if (shiftKey){
            if (this.$tempsel) {
                this.selectTemp();
                this.$deselect(this.$tempsel);
                this.$tempsel = null;
            }

            this.select(xmlNode, null, shiftKey);
        }
        else if (!this.bufferselect || valueList.length > 1) {
            this.select(xmlNode);
        }
        else {
            var id = apf.xmldb.getID(xmlNode, this);

            this.$deselect(this.$tempsel || this.$selected);
            this.$deindicate(this.$tempsel || this.$indicator);
            this.$tempsel = this.$indicate(document.getElementById(id));
            this.$select(this.$tempsel);

            this.timer = setTimeout(function(){
                _self.selectTemp();
            }, 400);
        }
    };

    /**
     * @private
     */
    this.selectTemp = function(){
        if (!this.$tempsel)
            return;

        clearTimeout(this.timer);
        this.select(this.$tempsel);
        this.$tempsel = null;
        this.timer    = null;
    };

    /**
     * Selects all the {@link term.traversenode traverse nodes} of this element
     *
     */
    this.selectAll = function(){
        if (!this.multiselect || !this.selectable
          || this.disabled || !this.xmlRoot)
            return;

        var nodes = this.isTreeArch
            ? this.xmlRoot.selectNodes(".//" 
              + this.traverse.split("|").join("|.//"))
            : this.getTraverseNodes();
        
        this.selectList(nodes);
    };

    /**
     * Retrieves an array or a document fragment containing all the selected
     * {@link term.datanode data nodes} from this element.
     *
     * @param {Boolean} [xmldoc] whether the method should return a document fragment.
     * @return {mixed} the selection of this element.
     */
    this.getSelection = function(xmldoc){
        var i, r;
        if (xmldoc) {
            r = this.xmlRoot
                ? this.xmlRoot.ownerDocument.createDocumentFragment()
                : apf.getXmlDom().createDocumentFragment();
            for (i = 0; i < valueList.length; i++)
                apf.xmldb.cleanNode(r.appendChild(
                    valueList[i].cloneNode(true)));
        }
        else
            for (r = [], i = 0; i < valueList.length; i++)
                r.push(valueList[i]);

        return r;
    };
    this.$getSelection = function(htmlNodes){
        return htmlNodes ? selectedList : valueList;
    }

    /**
     * Selects the next {@link term.datanode data node} to be selected.
     *
     * @param  {XMLElement}  xmlNode  the context {@link term.datanode data node}.
     * @param  {Boolean}     isTree
     */
    this.defaultSelectNext = function(xmlNode, isTree){
        var next = this.getNextTraverseSelected(xmlNode);
        //if(!next && xmlNode == this.xmlRoot) return;

        //Why not use this.isTreeArch ??
        if (next || !isTree)
            this.select(next ? next : this.getTraverseParent(xmlNode));
        else
            this.clearSelection(null, true);
    };

    /**
     * Selects the next {@link term.datanode data node} when available.
     */
    this.selectNext = function(){
        var xmlNode = this.getNextTraverse();
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * Selects the previous {@link term.datanode data node} when available.
     */
    this.selectPrevious = function(){
        var xmlNode = this.getNextTraverse(null, -1);
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * @private
     */
    this.getDefaultNext = function(xmlNode, isTree){
        var next = this.getNextTraverseSelected(xmlNode);
        //if(!next && xmlNode == this.xmlRoot) return;

        return (next && next != xmlNode)
            ? next
            : (isTree
                ? this.getTraverseParent(xmlNode)
                : null); //this.getFirstTraverseNode()
    };

    /**
     * Determines whether a node is selected.
     *
     * @param  {XMLElement} xmlNode  The {@link term.datanode data node} to be checked.
     * @return  {Boolean} whether the element is selected.
     */
    this.isSelected = function(xmlNode){
        if (!xmlNode) return false;

        for (var i = 0; i < valueList.length; i++) {
            if (valueList[i] == xmlNode)
                return true;
        }

        return false;
    };

    /**
     * This function checks whether the current selection is still correct.
     * Selection can become invalid when updates to the underlying data
     * happen. For instance when a selected node is removed.
     */
    this.$checkSelection = function(nextNode){
        if (valueList.length > 1) {
            //Fix selection if needed
            for (var lst = [], i = 0, l = valueList.length; i < l; i++) {
                if (apf.isChildOf(this.xmlRoot, valueList[i]))
                    lst.push(valueList[i]);
            }

            if (lst.length > 1) {
                this.selectList(lst);
                if(this.indicator
                  && !apf.isChildOf(this.xmlRoot, this.indicator)) {
                    this.setIndicator(nextNode || this.selected);
                }
                return;
            }
            else if (lst.length) {
                //this.clearSelection(null, true); //@todo noEvents here??
                nextNode = lst[0];
            }
        }

        if (!nextNode) {
            if (this.selected
              && !apf.isChildOf(this.xmlRoot, this.selected)) {
                nextNode = this.getFirstTraverseNode();
            }
            else if(this.selected && this.indicator
              && !apf.isChildOf(this.xmlRoot, this.indicator)) {
                this.setIndicator(this.selected);
            }
            else if (!this.selected){
                nextNode = this.xmlRoot
                    ? this.getFirstTraverseNode()
                    : null;
            }
            else {
                return; //Nothing to do
            }
        }

        if (nextNode) {
            if (this.autoselect) {
                this.select(nextNode);
            }
            else {
                if (!this.multiselect)
                    this.clearSelection();
                this.setIndicator(nextNode);
            }
        }
        else
            this.clearSelection();

        //if(action == "synchronize" && this.autoselect) this.reselect();
    };

    /**
     * @attribute {Boolean} [multiselect]   whether the user may select multiple items. Default is true, false for dropdown. 
     * @attribute {Boolean} [autoselect]    whether a selection is made after data is loaded. Default is true, false for dropdown. When the string 'all' is set, all {@link term.datanode data nodes} are selected.
     * @attribute {Boolean} [selectable]    whether the {@link term.datanode data nodes} of this element can be selected. Default is true.
     * @attribute {Boolean} [ctrlselect]    whether when a selection is made as if the user is holding the Ctrl key. When set to true each mouse selection will add to the current selection. selecting an already selected element will deselect it.
     * @attribute {Boolean} [allowdeselect] whether the user can remove the selection of this element. When set to true it is possible for this element to have no selected {@link term.datanode data node}.
     * @attribute {Boolean} [reselectable]  whether selected nodes can be selected again and the selection events are called again. Default is false. When set to false a selected {@link term.datanode data node} cannot be selected again.
     * @attribute {String}  [default]       the value that this component has when no selection is made.
     */
    this.selectable = true;
    if (this.ctrlselect === undefined)
        this.ctrlselect = false;
    if (this.multiselect === undefined)
        this.multiselect = true;
    if (this.autoselect === undefined)
        this.autoselect = true;
    if (this.delayedselect === undefined)
        this.delayedselect = true;
    if (this.allowdeselect === undefined)
        this.allowdeselect = true;
    this.reselectable = false;

    this.$booleanProperties["selectable"]    = true;
    //this.$booleanProperties["ctrlselect"]    = true;
    this.$booleanProperties["multiselect"]   = true;
    this.$booleanProperties["autoselect"]    = true;
    this.$booleanProperties["delayedselect"] = true;
    this.$booleanProperties["allowdeselect"] = true;
    this.$booleanProperties["reselectable"]  = true;

    this.$supportedProperties.push("selectable", "ctrlselect", "multiselect",
        "autoselect", "delayedselect", "allowdeselect", "reselectable", 
        "value", "default");

    this.$propHandlers["value"] = function(value){
        if (!this.bindingRules && !this.caption || !this.xmlRoot)
            return;

        // #ifdef __DEBUG
        if (!this.caption && !this.bindingRules["caption"]
          && !this.bindingRules[this.mainBind] && !this.caption)
            throw new Error(apf.formatErrorString(1074, this,
                "Setting the value of this component",
                "Could not find default value bind rule for this control."))
        // #endif

        if (apf.isNot(value))
            return this.clearSelection(null, noEvent);

        if (!this.xmlRoot)
            return this.select(value);

        var xmlNode = this.findXmlNodeByValue(value);
        if (xmlNode)
            this.select(xmlNode, null, null, null, null, noEvent);
        else
            return this.clearSelection(null, noEvent);
    };
    
    this.$propHandlers["allowdeselect"] = function(value){
        if (value) {
            var _self = this;
            this.oInt.onmousedown = function(e){
                if (!e) e = event;
                if (e.ctrlKey || e.shiftKey)
                    return;

                var srcElement = e.srcElement || e.target;
                if (_self.allowdeselect && (srcElement == this
                  || srcElement.getAttribute(apf.xmldb.htmlIdTag)))
                    _self.clearSelection(); //hacky
            }
        }
        else {
            this.oInt.onmousedown = null;
        }
    };

    this.$propHandlers["ctrlselect"] = function(value){
        if (value != "enter")
            this.ctrlselect = apf.isTrue(value);
    }

    function fAutoselect(){this.selectAll();}
    this.$propHandlers["autoselect"] = function(value){
        if (value == "all" && this.multiselect) {
            this.addEventListener("afterload", fAutoselect);
        }
        else {
            this.removeEventListener("afterload", fAutoselect);
        }
    };

    this.$propHandlers["multiselect"] = function(value){
        if (!value && valueList.length > 1) {
            this.select(this.selected);
        }

        //if (value)
            //this.bufferselect = false; //@todo doesn't return to original value
    };

    // Select Bind class
    // #ifdef __WITH_DATABINDING
    this.addEventListener("beforeselect", function(e){
        if (this.applyRuleSetOnNode("select", e.xmlNode, ".") === false)
            return false;
    }, true);
    // #endif

    // #ifdef __WITH_PROPERTY_BINDING || __WITH_OFFLINE_STATE
    this.addEventListener("afterselect", function (e){
        //#ifdef __WITH_PROPERTY_BINDING
        if (this.bindingRules && (this.bindingRules["value"]
          || this.bindingRules["caption"]) || this.caption) {
            this.value = this.applyRuleSetOnNode(this.bindingRules && this.bindingRules["value"] || this.valuerule
                ? "value"
                : "caption", e.xmlNode);

            //@todo this will also set the xml again - actually I don't think so because of this.value == value;
            this.setProperty("value", this.value);
        }

        if (this.sellength != valueList.length)
            this.setProperty("sellength", valueList.length);
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime) {  //@todo please optimize
            for (var sel = [], i = 0; i < valueList.length; i++)
                sel.push(apf.remote.xmlToXpath(valueList[i], null, true));

            apf.offline.state.set(this, "selection", sel);
            fSelState.call(this);
        }
        //#endif
    }, true);
    // #endif

    //#ifdef __WITH_OFFLINE_STATE
    function fSelState(){
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime) {
            apf.offline.state.set(this, "selstate",
                [this.indicator
                    ? apf.remote.xmlToXpath(this.indicator, null, true)
                    : "",
                 this.selected
                    ? apf.remote.xmlToXpath(this.selected, null, true)
                    : ""]);
        }
    }

    this.addEventListener("indicate", fSelState);
    //#endif
};

/**
 * @private
 */
apf.MultiSelectServer = {
    /**
     * @private
     */
    objects : {},

    /**
     * @private
     */
    register : function(xmlId, xmlNode, selList, jNode){
        if (!this.uniqueId)
            this.uniqueId = apf.all.push(this) - 1;

        this.objects[xmlId] = {
            xml   : xmlNode,
            list  : selList,
            jNode : jNode
        };
    },

    $xmlUpdate : function(action, xmlNode, listenNode, UndoObj){
        if (action != "attribute") return;

        var data = this.objects[xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
        if (!data) return;

        var nodes = xmlNode.attributes;

        for (var j = 0; j < data.list.length; j++) {
            //data[j].setAttribute(UndoObj.name, xmlNode.getAttribute(UndoObj.name));
            apf.xmldb.setAttribute(data.list[j], UndoObj.name,
                xmlNode.getAttribute(UndoObj.name));
        }

        //apf.xmldb.synchronize();
    }
};

// #endif
