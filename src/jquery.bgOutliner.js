/**
 * Name: bgOutliner
 * Author: Henrik Almér <henrik@agoodid.se>
 * Company: AGoodId
 * URL: http://www.agoodid.se
 * Version: Alpha 4
 * Last edited: Jan 24 2011
 * Size: 52 KB (minified and obfuscated 14 KB)
 *
 * This plugin controls expand/collapse and drag/drop of nested
 * structures presented in table form.
 *
 * Dependencies: jQuery, jQueryUI Core, jQuery UI Draggable,
 *               jQuery UI Droppable
 */

(function($) {
  var pluginName = 'bgOutliner';

  var config = {
    'addAsChild'            : false,
    'addClass'              : 'add-node',
    'childHtml'             : '<td class="%dataCellClass%">'
                              + '<span class="add-edit-icons">'
                              + '<a href="#" title="Add node"'
                              + ' class="%addClass%">'
                              + '<img src="'
                              + '../images/add.gif" alt="Add node"'
                              + ' width="12" height="12" />'
                              + '</a>'
                              + '<a href="#" title="Remove node"'
                              + ' class="%removeClass%">'
                              + '<img src="'
                              + '../images/trash.gif" alt="Remove node"'
                              + ' width="16" height="16" />'
                              + '</a>'
                              + '</span>'
                              + '<span class="%expColIconClass%">'
                              + '</span>'
                              + '<span class="%dataClass%">'
                              + 'Ny artikel'
                              + '</span>'
                              + '</td>'
                              + '<td></td>'
                              + '<td></td>',
    'childOfClassPrefix'    : 'child-of-',
    'collapsedClass'        : 'collapsed',
    'dataName'              : 'data',
    'dataClass'             : 'nested-data',
    'dataCellClass'         : 'nested-data-cell',
    'dragAndDrop'           : true,
    'dragHandle'            : false,
    'edit'                  : true,
    'expandCollapse'        : true,
    'expandedClass'         : 'expanded',
    'expColIconClass'       : 'expand-collapse-icon',
    'hasChildrenClass'      : 'has-children',
    'hoverClass'            : 'hover',
    'idPrefix'              : 'row',
    'indent'                : 20,
    'initHidden'            : true,
    'interval'              : 30,
    'levelClassPrefix'      : 'level',
    'onAddNode'             : false,
    'onAppend'              : false,
    'onBlur'                : false,
    'onDelete'              : false,
    'onDestroy'             : false,
    'onDrop'                : false,
    'onInit'                : false,
    'onInsertBefore'        : false,
    'onInsertAfter'         : false,
    'prepend'               : false,
    'removeClass'           : 'remove-node',
    'tolerance'             : 1
  }; // End config
  
  /**
   * Private methods
   */

  /**
   * This function is used to control that the supplied DOM element is
   * an instance of the plugin. If not it throws an error.
   *
   * CONTRACT
   * Expected input: A reference to a DOM object
   *
   * Return:         True on success. Throws error otherwise.
   */

  var assertInstanceOfBgOutliner = function($instance) {
    if (!$instance.data(pluginName)) {
      throw new Error('jQuery.'
                      + pluginName
                      + ' Instance Error. Element is not an instance'
                      + ' of jQuery.'
                      + pluginName);
    }
    
    return true;
  }; // End assertInstanceOfBgOutliner
  
  /**
   * This function is used to check if an element is the direct child of
   * another element.
   *
   * CONTRACT
   * Expected input: A reference to a DOM object and a potential child
   *
   * Return:         True on success. Throws error otherwise.
   */
  
  var assertChildOf = function($instance, $node) {  
    if ($node === undefined
      || !$node.parent().is('#' + $instance.attr('id'))) {
      
      throw new Error('jQuery.'
                      + pluginName
                      + ' Error. Element is not child of instanced'
                      + ' element');
    }
    
    return true;
  }; // End assertChildOf

  /**
   * Public methods
   */

  var methods = {

    /**
     * Method for initiating an instance of this plugin on a DOM element
     *
     * @param settings: JavaScript object of settings
     *
     * CONTRACT
     * Expected input: A DOM element that is not already an instance of
     *                 the plugin and that is the immidiate parent of
     *                 one or more table rows (could be a table, tbody,
     *                 thead or tfooter element). Also takes an optional
     *                 javascript object of settings.
     *
     * Return:         A reference to the supplied DOM object.
     */

    init: function(settings) {
      return this.each(function() {
        var $self = $(this),
            data = $self.data(pluginName);

        // Make sure we abide by our contract
        if (data) {
          throw new Error('jQuery.'
                          + pluginName
                          + ' Init Error. Supplied element is already'
                          + ' and instance of jQuery.'
                          + pluginName);
        }
        if ($self.children('tr').length <= 0) {
          throw new Error('jQuery.'
                          + pluginName
                          + ' Init Error. Supplied element is not'
                          + ' parent to any tr elements');
        }

        // Initiate plugin
        $self.data(pluginName, {
          settings  : config
        });

        // Update settings
        if (settings) {
          $.extend($self.data(pluginName).settings, settings);
        }

        settings = $self.data(pluginName).settings;

        // Hide all children on init, if initHidden is true
        var initClass;
        if (settings.initHidden) {
          $self.find("tr[class*='" + settings.childOfClassPrefix + "']")
            .hide();
          initClass= settings.collapsedClass;
        } else {
          initClass = settings.expandedClass;
        }
        $self
          .find("tr[class*='" + settings.hasChildrenClass + "']")
          .addClass(initClass);
        
        // Iterate over all nodes and set their indentaion level
        $self.find('tr').each(function() {
          $self.bgOutliner('setIndentation', $(this));
        });

        // Assign click handlers to expand/collapse-links
        $self
        .find('tr.' + settings.hasChildrenClass + ' .'
              + settings.dataCellClass + ' .'
              + settings.expColIconClass)
        .live('click.' + pluginName, function(e) {
          $self.bgOutliner('toggleNode', $(this).closest('tr'));

          e.preventDefault();
        });
        
        // Make mousover/mousout events toggle a hover class
        $self.find('tr').live('mouseover.' + pluginName, function(e) {
          $(this).addClass(settings.hoverClass);
        }).live('mouseout.' + pluginName, function(e) {
          $(this).removeClass(settings.hoverClass);
        });
        
        // Do further init setups for editing of nodes, if edit is true
        if (settings.edit === true) {
          $self.bgOutliner('initEdit');
        }

        // Call the onInit callback function, if it is defined
        if ($.isFunction(settings.onInit)) {
          settings.onInit.call(this);
        }
      });
    }, // End methods.init
    
    /**
     * Initiates the editing (drag and drop) capabilities of the
     * outliner. Should be called by the init method if the edit setting
     * is set to true.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance
     *
     * Return:         A reference to the supplied DOM element
     */
    
    initEdit: function() {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);

      // Alias data and settings
      var data = $self.data(pluginName),
          settings = data.settings;
      
      /**
       * Create drop indicator
       */
      
      var dropIndicatorHtml = '<div class="drop-indicator-bar">'
                              + '<div class="col-indicator">'
                              + '<div class="thick-rule"></div>'
                              + '</div>'
                              + '<div class="row-indicator">'
                              + '<div class="thin-rule"></div>'
                              + '</div>'
                              + '</div>';

      data.dropIndicator = $(dropIndicatorHtml);
      $('body').append(data.dropIndicator);

      // Set position and width of drop indicator
      data.dropIndicator.offset($self.offset());
      data.dropIndicator.width($self.outerWidth());
      
      var hoveredLevel,
          $hoveredRow,
          hoveredRowLevel,
          lastMousePos = { x: 0, y: 0 },

          lastRun = 0,
          relativeDropPos,
          targetLevel,
          targetPosition = {top: 0, left: 0},
          $targetRow,
          targetRowLevel,
          thisMousePos,
          thisRun = 0;

      // Get the base indent (the number of pixels from the left edge of
      // the instance to the level 0 expand collapse icon)
      data.leftColumn = $self
                        .find('tr:first .' + settings.expColIconClass)
                        .offset().left;
      // Get the width of the expand/collapse icon
      data.iconSize = $self
                        .find('tr:first .' + settings.expColIconClass)
                        .width();

      // Get the top
      data.topPosition = $self.find('tr:first').offset().top;

      /**
       * Define settings for jQuery UI Draggable & Droppable
       */

      var draggableConfig = {
        appendTo        : 'body',
        revert          : 'invalid',
        revertDuration  : 0,
        drag: function(e, ui) {

          /**
           * Drag function. Determines what action to take when dragging
           * stops. We need this information in orde be able to show a
           * correctly positioned drop indicator.
           *
           * CONTRACT
           * Expected input: A jQuery event and a reference to the UI
           *                 object.
           *
           * Return:         –
           */

          // Check for throttling
          thisRun = new Date().getTime();
          if(settings.interval > thisRun - lastRun ) {
            return;
          }
          lastRun = thisRun;

          // Check if mouse position has changed
          thisMousePos = { x: e.pageX, y: e.pageY };
          if (lastMousePos.x === thisMousePos.x
              &&
              lastMousePos.y === thisMousePos.y ) {
            return;
          }
          lastMousePos = thisMousePos;
          
          // Reset variables from last run
          hoveredLevel = 0;
          hoveredRowLevel = 0;
          targetLevel = 0;
          targetRowLevel = 0;
          $hoveredRow = null;
          $targetRow = null;

          // Find the row being hovered
          $self.find('tr').each(function() {
            // Add proportions and offset data to the row (required by
            // jQuery UI Droppable)
            this.proportions = {width: this.offsetWidth,
                                height: this.offsetHeight};
            this.offset = $(this).offset();
            
            // Use the intersect function of jQuery UI Droppable to
            // determine if this row is being hovered
            var intersect = $.ui.intersect($.ui.ddmanager.current,
                                            this,
                                            'pointer');
            
            // Assign hover class if this row is hovered
            if (intersect) {
              $(this).addClass(settings.hoverClass);
            } else {
              $(this).removeClass(settings.hoverClass);
            }
          });
          
          $hoveredRow = $self.find('.' + settings.hoverClass + ':first');

          /**
           * Determine at what level the user wants to drop the node.
           * We do this by defining columns that are as wide as the
           * indent setting and checking which column the mouse is in.
           */

          relativeDropPos = thisMousePos.x - data.leftColumn;
          if (relativeDropPos <= 0) {
            hoveredLevel = 0;
          } else {
            hoveredLevel = relativeDropPos/settings.indent;
          }
          hoveredLevel = parseInt(hoveredLevel, 10);

          // Make sure that the level is no more than one level higher
          // than the target level.
          if ($hoveredRow.length > 0) {
            hoveredRowLevel = $self.bgOutliner('getLevel', $hoveredRow);
            
            if (hoveredLevel > hoveredRowLevel + 1) {
              hoveredLevel = hoveredRowLevel + 1;
            }
          } else {
            hoveredLevel = 0;
          }

          // Get invalid drop positions for the dragged node
          data.invalidDropPositions = 
            $self.bgOutliner('getInvalidDropPositions',
                              $(e.target).closest('tr'),
                              hoveredLevel);
          
          // If the hovered row is in the list of invalid positions, we
          // must adjust the hovered level accordingly
          if (data.invalidDropPositions
            .indexOf($hoveredRow.index() + 1) !== -1) {
            hoveredLevel =
              $self.bgOutliner('getLevel',
                                $self.find('tr:eq('
                                + (data.invalidDropPositions[0] - 1)
                                + ')'));
          }

          // Get valid drop positions for the hovered level
          data.dropPositionsForLevel =
            $self.bgOutliner('getDropPositionsForLevel', hoveredLevel);

          // Subtract invalid positions from valid positions
          data.dropPositions =
            data.dropPositionsForLevel.filter(function(val, ix) {
               return data.invalidDropPositions.indexOf(val) === -1;
            });

          // Determine closest candidate for drop
          $.each(data.dropPositions, function(ix, pos) {
            if ($hoveredRow.index() === (pos - 1)) {
              $targetRow = $self.find('tr:eq(' + (pos - 1) + ')');
              return false;
            }
            return;
          });
          targetLevel = hoveredLevel;

          /**
           * Determine target rows position, settings the top variable
           * to be the bottom of the target row and the left variable to
           * the left side of the instanced DOM element.
           */

          if ($targetRow !== null && $targetRow.length > 0) {
            targetPosition.top = parseInt($targetRow.offset().top
                                  + $targetRow.height()
                                  - (data.dropIndicator.height()/2),10);
            targetPosition.left = $self.offset().left;
            
            // Show/Update drop indicator
            $self.bgOutliner('showDropIndicator',
                              targetPosition,
                              targetLevel);

            // Store information about the target row in the data object
            data.target = 'after';
            data.targetRow = $targetRow;
            data.targetLevel = targetLevel;
            data.droppedNode = $(e.target);
          } else if (thisMousePos.y < data.topPosition) {

            /**
             * If no target row is found, and if the current mouse
             * position is above the instanced element, assume the user
             * is trying to drop before the top root level node.
             */ 

            targetPosition.top = parseInt(data.topPosition
                                  - (data.dropIndicator.height()/2),10);
            targetPosition.left = $self.offset().left;
            
            // Show/Update drop indicator
            $self.bgOutliner('showDropIndicator',
                              targetPosition,
                              targetLevel);

            // Store information about the target row in the data object
            data.target = 'before';
            data.targetRow = $self.find('tr:first');
            data.targetLevel = targetLevel;
            data.droppedNode = $(e.target);
          } else if (thisMousePos.y > data.topPosition) {

            /**
             * If no target row is found, and if the current mouse
             * position is below the instanced element, assume the user
             * is trying to drop as the last root level node
             */

            targetLevel = 0;
            $targetRow = $self.find('tr:last');
            targetPosition.top = parseInt($self.find('tr:visible:last')
                                    .offset().top
                                  + $self.find('tr:visible:last')
                                    .height()
                                  - (data.dropIndicator.height()/2),10);
            targetPosition.left = $self.offset().left;
            
            // Show/Update drop indicator
            $self.bgOutliner('showDropIndicator',
                              targetPosition,
                              targetLevel);

            // Store information about the target row in the data object
            data.target = 'after';
            data.targetRow = $targetRow;
            data.targetLevel = 0;
            data.droppedNode = $(e.target);
          }
        },
        stop: function(e, ui) {

          /**
           * Stop function
           */
          
          // Hide the drop indicator
          $self.bgOutliner('hideDropIndicator');
          
          // Save the new structure
          $self.bgOutliner('insertAt', data.targetRow, data.targetLevel,
                            data.droppedNode, data.target);
        },
        helper: function(e, ui) {

          /**
           * Helper function. Takes a dragged row and clones it to a new
           * table in a div. This enables us to show the dragged element
           * on screen while it's dragged.
           *
           * CONTRACT
           * Expected input: A jQuery event and a reference to the UI
           *                 object.
           *
           * Return:         A DOM element containing a table with the 
           *                 dragged nodes.
           */
          
          var $helper = $('<div class="nested-table-item-dragging">'
                          + '<table class="'
                          + pluginName
                          + '-dragging"></table>'
                          + '</div>')
                        .find('table')
                        .append($(e.target).closest('tr')
                          .clone()
                          .removeClass($self.data(pluginName)
                            .settings.hoverClass));
          
          return $helper;
        }
      };
      
      if (settings.dragHandle !== false) {
        draggableConfig.handle = settings.dragHandle;
      }
      
      /**
       * Initiate jQuery UI Draggable & Droppable
       */
      
      $self
      .find('tr')
      .draggable(draggableConfig)
      .data(pluginName, true);
      
      // Init Draggable & Droppable on live elements
      $self.find('tr').live('hover.' + pluginName, function() {
        if ($(this).data(pluginName) !== true) {
          $(this).data(pluginName, true);
          $(this).draggable(draggableConfig);
        }
      });

      /**
       * Bind click handlers for adding and removing nodes
       */
      
      $self
      .find('.' + config.dataCellClass + ' .' + config.addClass)
      .live('click.' + pluginName, function(e) {        
        // Add a node as child to the clicked node
        $self.bgOutliner('addNode', $(this).closest('tr'));
        e.preventDefault();
      });
      
      $self
      .find('.' + config.dataCellClass + ' .' + config.removeClass)
      .live('click.' + pluginName, function(e) {        
        // Remove node
        $self.bgOutliner('removeNode', $(this).closest('tr'));
        e.preventDefault();
      });

      return $self;
    }, // End methods.initEdit

    /**
     * Method for destroying an instance of this plugin. Removes all
     * plugin data and all bound events.
     *
     * CONTRACT
     * Expected input: A collection of DOM elements that are a plugin
     *                 instances.
     *
     * Return:         A reference to the supplied DOM element
     */

    destroy: function() {
      return this.each(function() {
        var $self = $(this),
            data = $self.data(pluginName);

        assertInstanceOfBgOutliner($self);

        var settings = $self.data(pluginName).settings;

        // Unbind live click handlers from expand/collapse links
        $self
        .find('tr.' + settings.hasChildrenClass + ' .'
              + settings.dataCellClass + ' .'
              + settings.expColIconClass)
        .die('click.' + pluginName);
        
        // Unbind hover event
        $self.find('tr').die('hover.' + pluginName);
        
        if (settings.edit === true) {
          // Remove drop indicator, if it has been added
          if (data.dropIndicator) {
            data.dropIndicator.remove();
          }
        
          // Remove draggable config and events
          $self
          .find('tr')
          .draggable('destroy')
          .removeData(pluginName);
          
          // Unbind click handlers
          $self
          .find('.' + config.dataCellClass + ' .'
            + config.removeClass)
          .die('click.' + pluginName);
          $self
          .find('.' + config.dataCellClass + ' .' + config.addClass)
          .die('click.' + pluginName);
        }

        // Call the onDestroy callback function, if it is defined
        if ($.isFunction(settings.onDestroy)) {
          settings.onDestroy.call(this);
        }

        // Remove all data associated with the plugin
        $self.removeData(pluginName);
      });
    }, // End methods.destroy
    
    /**
     * Method for updating settings for a plugin instance
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance
     *
     * Return:         A reference to the instanced DOM element
     */

    updateSettings: function(settings) {
      return this.each(function() {
        var $self = $(this);

        assertInstanceOfBgOutliner($self);
        
        // Update settings
        if (settings) {
          $.extend($self.data(pluginName).settings, settings);
        }
      });
    },
    
    /**
     * Toggles expanded and collapsed classes for an element and calls
     * a helper function to toggle visibility of child elements.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 table row that is a direct descendant to the
     *                 supplied element.
     *
     * Return:         A reference to the instanced DOM element
     */
    
    toggleNode: function($node) {
      var $self = this;
    
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
    
      // Toggle expandedClass and collapsedClass
      $node.toggleClass($self.data(pluginName)
                        .settings.expandedClass);
      $node.toggleClass($self.data(pluginName)
                        .settings.collapsedClass);

      // Toggle visibility of descendants
      $self.bgOutliner('toggleDescendants', $node);
      
      return $self;
    },

    /**
     * Method for toggling visibility of a parents descendants. Runs
     * recursively to toggle all children and grand-children.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance & a table
     *                 row that is a direct descendant to the supplied
     *                 element.
     *
     * Return:         A reference to the instanced DOM element
     */

    toggleDescendants: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;

      // Find already expanded children and store them
      var sId = $node.attr('id'),
          $expandedChildren = $self.find('.'
                                        + settings.childOfClassPrefix
                                        + sId + '.'
                                        + $self.data(pluginName)
                                          .settings.expandedClass);

      // Call recursively to toggle all descendants
      if ($expandedChildren.length > 0) {
        $expandedChildren.each(function() {
          $self.bgOutliner('toggleDescendants', $(this));
        });
      }
      
      // Toggle all direct children
      this.find('.' + settings.childOfClassPrefix + sId)
        .each(function() {
        $(this).toggle();
      });
      
      return $self;
    }, // End methods.toggleChildren

    /**
     * Expands node
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 table row that is a direct descendant to the
     *                 supplied element.
     *
     * Return:         A reference to the instanced DOM element
     */

    expandNode: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      if ($node.hasClass(settings.collapsedClass)) {
        $self.bgOutliner('toggleNode', $node);
      }
      
      // Add the expanded class
      $node
      .removeClass(settings.collapsedClass)
      .addClass(settings.expandedClass);
      
      return $self;
    }, // End methods.expandNode
    
    /**
     * Collapses node
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 table row that is a direct descendant to the
     *                 supplied element.
     *
     * Return:         A reference to the instanced DOM element
     */
    
    collapseNode: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      if ($node.hasClass(settings.expandedClass)) {
        $self.bgOutliner('toggleNode', $node);
      }
      
      // Add the collapsed class
      $node
      .removeClass(settings.expandedClass)
      .addClass(settings.collapsedClass);
      
      return $self;
    }, // End methods.collapseNode

    /**
     * Expands all nodes
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance.
     *
     * Return:         A reference to the instanced DOM element
     */

    expandAll: function() {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);

      var settings = $self.data(pluginName).settings;

      $self.find('tr.' + settings.hasChildrenClass).each(function() {
        $self.bgOutliner('expandNode', $(this));
      });

      return $self;
    }, // End methods.expandAll

    /**
     * Collapses all nodes
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance.
     *
     * Return:         A reference to the instanced DOM element
     */

    collapseAll: function() {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);

      var settings = $self.data(pluginName).settings;
      
      var $nodes =
        $self.find('tr.' + settings.hasChildrenClass + ':visible')
        .get().reverse();
        
      $.each($nodes, function() {
        $self.bgOutliner('collapseNode', $(this));
      });

      return $self;
    }, // End methods.collapseAll

    /**
     * Adds a new node to the instance. If a parent node is supplied the
     * new node is added as the first child of that parent node.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and an
     *                 optional table row that is a direct descendant to
     *                 the supplied element.
     *
     * Return:         A reference to the instanced DOM element
     */

    addNode: function($parent) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      if ($parent) {
        assertChildOf($self, $parent);
      }
      
      var $child,
          iLevel,
          iChildKey,
          iCurKey,
          sChildHtml,
          sChildId,
          sChildRow,
          sParentId;
      
      var settings = $self.data(pluginName).settings;

      // Determine whether to add the new node as a child or sibling to
      // the parent node
      if (settings.addAsChild === false) {
        var iGrandParent = $self.bgOutliner('getParent', $parent);
        $parent = (iGrandParent !== null) ?
          $self.find('#' + settings.idPrefix + iGrandParent)
          : null;
      }

      // Get parent info
      if ($parent) {
        // Expand the parent node
        $self.bgOutliner('expandNode', $parent);

        // Get level and parent id
        iLevel = $self.bgOutliner('getLevel', $parent) + 1;
        sParentId = $parent.attr('id');
      } else {
        iLevel = 0;
        sParentId = null;
      }
      
      // Find the node with the highest id and add 1
      iChildKey = 0;
      $self.find('tr').each(function() {
        iCurKey = parseInt($(this).attr('id')
                    .substring(settings.idPrefix.length),10);
        iChildKey = (iChildKey < iCurKey) ? iCurKey : iChildKey;
      });
      iChildKey++;
      sChildId = settings.idPrefix + iChildKey.toString();
      
      // Generate HTML for child node
      sChildHtml = settings.childHtml
                    .replace(/%dataCellClass%/ig,
                              settings.dataCellClass)
                    .replace(/%addClass%/ig,
                              settings.addClass)
                    .replace(/%removeClass%/ig,
                              settings.removeClass)
                    .replace(/%expColIconClass%/ig,
                              settings.expColIconClass)
                    .replace(/%dataClass%/ig,
                              settings.dataClass);
      
      // Create the child node
      sChildRow = '<tr id="'
                  + sChildId
                  + '" class="';
      if (sParentId !== null) {
        sChildRow = sChildRow
                    + settings.childOfClassPrefix
                    + sParentId
                    + ' ';
      }
      sChildRow = sChildRow
                  + settings.levelClassPrefix
                  + iLevel
                  + '">'
                  + sChildHtml
                  + '</tr>';
      
      $child = $(sChildRow);
      
      // Insert the child node at the correct place in the instance
      if ($parent) {
        // Add to existing node
        $self.bgOutliner('appendNode', $parent, $child);
      } else {
        // Add at root level
        if (settings.prepend) {
          $self.prepend($child);
        } else {
          $self.append($child);
        }
      }
      
      // Call the onAddNode callback function, if it is defined
      if ($.isFunction(settings.onAddNode)) {
        settings.onAddNode.call(this, $child, $parent);
      }
      
      return $self;
    }, // End methods.addNode

    /**
     * Removes a node and all of its descendants
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         A reference to the instanced DOM element
     */

    removeNode: function($node) {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);

      var settings = $self.data(pluginName).settings;

      var iParent = $self.bgOutliner('getParent', $node);
      var $siblings = $self
                      .find('.' + settings.childOfClassPrefix
                            + settings.idPrefix
                            + iParent);

      // Check if the hasChildren class should be removed on the nodes
      // parent element
      if ($siblings.length <= 1) {
        $self
        .find('#' + settings.idPrefix + iParent)
        .removeClass(settings.hasChildrenClass);
      }

      // Remove all descendants
      if ($node.hasClass(settings.hasChildrenClass)) {
        $self
        .find('.' + settings.childOfClassPrefix + $node.attr('id'))
        .each(function() {
          $self.bgOutliner('removeNode', $(this));
        });
      }

      // Call the onRemoveNode callback function, if it is defined
      if ($.isFunction(settings.onRemoveNode)) {
        settings.onRemoveNode.call(this, $node);
      }
      
      // Remove node
      $node.remove();

      return $self;
    }, // End methods.removeNode

    /**
     * Appends a node to another node
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, a table
     *                 row that is a direct descendant to the supplied
     *                 element and one more table row that should be
     *                 appended to the target node.
     *
     * Return:         A reference to the instanced DOM element
     */

    appendNode: function($target, $node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $target);
      
      var $family = [$node],
          $targetFamily,
          $lastDescendant,
          targetIndex = $target.index();
      
      var settings = $self.data(pluginName).settings;
      
      // Is this an existing node?
      if ($node.parent().is('#' + $self.attr('id'))) {
        $family = $self.bgOutliner('getFamily', $node);
        $self.bgOutliner('setParent', $target, $node);
      }

      // Does the target node already have children?
      if ($target.hasClass(settings.hasChildrenClass)) {
        // Insert at top or bottom?
        if (!settings.prepend) {        
          // Find the last descendant of the target node
          $targetFamily = $self.bgOutliner('getFamily', $target);
          $lastDescendant = $targetFamily[$targetFamily.length - 1];
          targetIndex = $lastDescendant.index();
        }
      } else {
        $target.addClass(settings.hasChildrenClass);
        $self.bgOutliner('expandNode', $target);
      }

      $.each($family, function() {
        $(this).insertAfter($self.find('tr:eq(' + targetIndex + ')'));
        $self.bgOutliner('setIndentation', $(this));
        targetIndex++;
      });
    
      if ($.isFunction(settings.onAppend)) {
        settings.onAppend.call(this, $node, $target);
      }
    }, // End methods.appendNode

    /**
     * Inserts a node at a given place in the hierarchy. Either before
     * or after the target.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, a table
     *                 row that is a direct descendant to the supplied
     *                 element, an integer representing the level to
     *                 insert at, one more table row that should be
     *                 appended to the target node and a string
     *                 indicating whether to insert the node before or
     *                 after the target.
     *
     * Return:         A reference to the instanced DOM element
     */

    insertAt: function($target, iInsertLevel, $node, sInsertPosition) {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $target);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      var $family = $self.bgOutliner('getFamily', $node),
          iInsertPosition,
          iNodeLevel = $self.bgOutliner('getLevel', $node),
          $parent,
          iSrcParent = $self.bgOutliner('getParent', $node),
          $srcSiblings = $self.find('.' + settings.childOfClassPrefix
            + settings.idPrefix
            + iSrcParent);

      // Check if the hasChildren class should be removed on the nodes
      // parent element
      if ($srcSiblings.length <= 1) {
        $self
        .find('#' + settings.idPrefix + iSrcParent)
        .removeClass(settings.hasChildrenClass);
      }
      
      // Find parent node
      $parent = (iInsertLevel === 0) ? null
        : $target.add($target.prevAll()).filter('.'
          + settings.levelClassPrefix
          + (iInsertLevel - 1)).last();
      
      // Add hasChildren class to parent, if not already added
      if ($parent !== null) {
        if (!$parent.hasClass(settings.hasChildrenClass)) {
          $parent.addClass(settings.hasChildrenClass);
        }
        $self.bgOutliner('expandNode', $parent);
      }
        
      // Set level and parent classes and set indentation
      $node
        .removeClass(settings.levelClassPrefix + iNodeLevel)
        .addClass(settings.levelClassPrefix + iInsertLevel);
      $self.bgOutliner('setIndentation', $node);
        
      $self.bgOutliner('setParent', $parent, $node);

      if ($target.is('#' + $node.attr('id'))) {
        $target = $target.prevAll().first();
      }

      // Insert this node
      if (sInsertPosition === 'before') {
        $self.prepend($node);
        iInsertPosition = 0;
      } else {
        $node.insertAfter($target);
        iInsertPosition = $target.index() + 1;
      }

      // Insert all child nodes
      $family.shift();
      $.each($family, function() {
        $(this).insertAfter($self.find('tr:eq(' + iInsertPosition + ')'));
        $self
          .bgOutliner('setLevel', $(this))
          .bgOutliner('setIndentation', $(this));
        iInsertPosition = $(this).index();
      });
      
      if ($.isFunction(settings.onDrop)) {
        settings.onDrop.call(this, $node, $parent, iInsertPosition);
      }
      
      return $self;
    }, // End methods.insertAt

    /**
     * Runs recursively to get a node with all of its descendants
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         An collection of DOM elements containing the
     *                 given node and all of its descendants.
     */

    getFamily: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      var $family = [$node],
          $descendants = [];

      $self
      .find('.' + settings.childOfClassPrefix + $node.attr('id'))
      .each(function() {      
        if ($(this).hasClass(settings.hasChildrenClass)) {
          $descendants = $self.bgOutliner('getFamily', $(this));

          $.each($descendants, function() {
            $family.push($(this));
          });
        } else {
          $family.push($(this));
        }
      });
      
      return $family;
    }, // End methods.getFamily

    /**
     * Gets the key part of the parent id for a child node
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         An integer representing the key of the provided
     *                 nodes parent, or null if the node has no parent.
     */

    getParent: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var iKey,
          iEndPos,
          iStartPos,
          sClass;
      
      var settings = $self.data(pluginName).settings;
      
      // Extract the key indicating the parent from the nodes class
      sClass = $node.attr('class');
      if (sClass.indexOf(settings.childOfClassPrefix) !== -1) {
        iStartPos = sClass.indexOf(settings.childOfClassPrefix)
                      + settings.childOfClassPrefix.length
                      + settings.idPrefix.length;
        iEndPos = sClass.indexOf(' ', iStartPos);
        
        iKey = (iEndPos !== -1)
          ? parseInt(sClass.substring(iStartPos, iEndPos), 10)
          : parseInt(sClass.substring(iStartPos), 10);
      } else {
        iKey = null;
      }
    
      return iKey;
    }, // End methods.getParent

    /**
     * Gets the level of a node that is a child to an instance
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         An integer representing the supplied rows level
     */

    getLevel: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var iLevel,
          iEndPos,
          iStartPos,
          sLevelClass,
          settings;
      
      settings = $self.data(pluginName).settings;
      
      // Parse level class
      sLevelClass = $node.attr('class');
      iStartPos = sLevelClass.indexOf(settings.levelClassPrefix)
                                      + settings.levelClassPrefix
                                        .length;
      iEndPos = sLevelClass.indexOf(' ', iStartPos);

      iLevel = (-1 !== iEndPos)
        ? parseInt(sLevelClass.substring(iStartPos, iEndPos), 10)
        : parseInt(sLevelClass.substring(iStartPos), 10);

      return iLevel;
    }, // End methods.getLevel

    /**
     * Sets the parent class for a node
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance and two
     *                 table row that are direct descendants to the
     *                 supplied element.
     *
     * Return:         A reference to the instance.
     */

    setParent: function($parent, $node) {
      var $self = this;
      
      // Honor contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;

      // Parse the current parent class and remove it
      var parentClass = $node.attr('class');
      
      var iStartPos = parentClass.indexOf(settings.childOfClassPrefix);
      var iEndPos = parentClass.indexOf(' ', iStartPos);

      if (-1 === iStartPos) {
        parentClass = false;
      } else {
        parentClass = (-1 !== iEndPos)
          ? parentClass.substring(iStartPos,iEndPos)
          : parentClass.substring(iStartPos);
      }
      $node.removeClass(parentClass);
      
      // Add the new parent class
      if ($parent !== null) {
        $node.addClass(settings.childOfClassPrefix + $parent.attr('id'));
      }
      
      return $self;
    }, // End methods.setParent
    
    /**
     * Method that sets the level class for a node
     *
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         A reference to the instance.
     */
    
    setLevel: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      var iCurrentLevel = $self.bgOutliner('getLevel', $node),
          iParentKey = $self.bgOutliner('getParent', $node),
          iNewLevel = $self.bgOutliner('getLevel',
            $('#' + settings.idPrefix + iParentKey)) + 1;
      
      // Change level classes
      $node
        .removeClass(settings.levelClassPrefix + iCurrentLevel)
        .addClass(settings.levelClassPrefix + iNewLevel);

      return $self;
    }, // End methods.setLevel
    
    /**
     * Method that sets the indentation level for a node
     *
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         A reference to the instance.
     */

    setIndentation: function($node) {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;
      
      var margin = settings.indent * $self.bgOutliner('getLevel',
                                                      $node);
      
      $node
      .find('.' + settings.dataCellClass + ' .'
            + settings.expColIconClass)
      .css('margin-left', margin + 'px');

      return $self;
    }, // End methods.setIndentation
    
    /**
     * Method for checking if a node has children
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, and a
     *                 (non optional) table row that is a direct
     *                 descendant to the supplied element.
     *
     * Return:         A boolean value that is true if the node has
     *                 children and false if not.
     */
    
    hasChildren: function($node) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var settings = $self.data(pluginName).settings;

      return $node.hasClass(settings.hasChildrenClass);
    }, // End methods.hasChildren
    
    /**
     * Shows a horizontal rule, indicating where a dragged element will
     * be placed once it is dropped.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, a tuple
     *                 representing an absolute position on screen and
     *                 an integer representing the level to drop at.
     *
     * Return:         A reference to the instance
     */
    
    showDropIndicator: function(tPosition, iLevel) {
      var $self = this;

      // Honor the contract
      assertInstanceOfBgOutliner($self);

      var settings = $self.data(pluginName).settings;
      
      var baseIndent = $self.data(pluginName).leftColumn
            - $self.offset().left
            + ($self.data(pluginName).iconSize/2),
          colIndicatorWidth = baseIndent
            + (settings.indent * (iLevel));

      // Show drop indicator
      $self.data(pluginName).dropIndicator.show();

      // Set vertical position of drop indicator
      $self
      .data(pluginName)
      .dropIndicator
      .css({position: 'absolute', top: tPosition.top,
        left: tPosition.left});
      
      // Adjust width of col-indicator and row-indicator to match the
      // hovered level
      $self.data(pluginName).dropIndicator
        .find('.col-indicator')
        .width(colIndicatorWidth);
      $self.data(pluginName).dropIndicator
        .find('.row-indicator')
        .width($self.data(pluginName).dropIndicator.width()
                - colIndicatorWidth);

      return $self;
    }, // End methods.showDropIndicator
    
    /**
     * Hides the drop indicator
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance.
     *
     * Return:         A reference to the instance
     */
    
    hideDropIndicator: function() {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      
      $self.data(pluginName).dropIndicator.hide();
      
      return $self;
    }, // End methods.hideDropIndicator
    
    /**
     * Gets available drop position for the current level
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance and an
     *                 integer representing the level to fetch positions
     *                 for.
     *
     * Return:         An array of possible drop positions
     */
    
    getDropPositionsForLevel: function(iLevel) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      
      var settings = $self.data(pluginName).settings;
      
      var positions = [],
          $nodes,
          $parentLevelNodes,
          $nodeFamily;
      
      // Add all nodes at the current level to the collection
      $nodes = $self.find('.' + settings.levelClassPrefix + iLevel);

      if (iLevel > 0) {
        // If not at root level, add positions from the parent level
        $parentLevelNodes = $self.find('.'
                                        + settings.levelClassPrefix
                                        + (iLevel - 1));

        $parentLevelNodes.each(function() {
          positions.push($(this).index() + 1);
        });
      } else {
        // If we are at root level, add the 0 position
        positions.push(0);
      }

      $nodes.each(function() {
        if ($self.bgOutliner('hasChildren', $(this))) {
          $nodeFamily = $self.bgOutliner('getFamily', $(this));
          positions.push($nodeFamily[$nodeFamily.length - 1]
                          .index() + 1);
        } else {
          positions.push($(this).index() + 1);
        }
      });

      return positions.unique().sort(function(a, b) {
        return (a - b);
      });
    }, // End methods.getDropPositionsForLevel
    
    /**
     * Gets a list of invalid drop positions for a given node. Using
     * this method makes sure that no nodes can be dropped as
     * descendants to themselves.
     *
     * CONTRACT
     * Expected input: A DOM element that is a plugin instance, a (non
     *                 optional) table row that is a direct descendant
     *                 to the supplied element and an integer
     *                 representing a level.
     *
     * Return:         An array of invalid drop positions
     */
    
    getInvalidDropPositions: function($node, iLevel) {
      var $self = this;
      
      // Honor the contract
      assertInstanceOfBgOutliner($self);
      assertChildOf($self, $node);
      
      var $family,
          nodeLevel,
          positions = [];
      
      $family = $self.bgOutliner('getFamily', $node);
      
      $.each($family, function() {      
        positions.push($(this).index() + 1);
      });
      
      nodeLevel = $self.bgOutliner('getLevel', $node);
      while (iLevel < nodeLevel) {
        positions.pop();
      
        iLevel++;
      }
      
      return positions;
    } // End methods.getInvalidDropPositions
  }; // End methods

  /**
   * bgOutliner function.
   *
   * CONTRACT
   * Expected input: A DOM element and a string representing a method
   *                 in the methods object.
   *
   * Return:         The method that was requested.
   */

  $.fn.bgOutliner = function(method) {
    if (methods[method]) {
      return methods[method]
        .apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      throw new Error('Method '
                      + method
                      + ' does not exist on jQuery.' + pluginName);
    }
  }; // End $.fn.bgOutliner
}(jQuery));

/**
 * Add ECMA262-5 Array methods if not supported natively
 *
 * Extends Array object with common methods if it they are not defined
 * (needed for Internet Explorer compatibility)
 *
 * Source: http://stackoverflow.com/questions/2790001/
 *  fixing-javascript-array-functions-in-internet-explorer
 *  -indexof-foreach-etc
 */

if (!('filter' in Array.prototype)) {
  Array.prototype.filter = function(filter, that /*opt*/) {
    var other= [], i, v, n;
    for (i=0, n= this.length; i<n; i++) {
      if (i in this && filter.call(that, v= this[i], i, this)) {
        other.push(v);
      }
    }
    return other;
  };
}
if (!('indexOf' in Array.prototype)) {
  Array.prototype.indexOf = function(find, i /*opt*/) {
    if (i===undefined) { i= 0; }
    if (i<0) { i+= this.length; }
    if (i<0) { i= 0; }
    var n;
    for (n= this.length; i<n; i++) {
      if (i in this && this[i]===find) {
        return i;
      }
    }
    return -1;
  };
}

/**
 * Utility function that allows removing of duplicates in an array
 *
 * Source: http://www.martienus.com/code/
 *         javascript-remove-duplicates-from-array.html
 */

if (!('unique' in Array.prototype)) {
  Array.prototype.unique = function() {
    var r = [], i, x, n, y;
    o:for(i = 0, n = this.length; i < n; i++) {
      for(x = 0, y = r.length; x < y; x++) {
        if(r[x]===this[i]) {
          return;
        }
      }
      r[r.length] = this[i];
    }
    return r;
  };
}