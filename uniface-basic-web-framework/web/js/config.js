/*global app*/

app.config = {

    //The complete config object passed from Uniface
    data: {},

    /*
     *  Return the menu item associated with a particular path
     */
    getResourceByNameAndAction: function (resourceName, action) {
        "use strict";
        
        var routeCollection,
            route;
        
        routeCollection = this.data.routes;
        
        //If no resource is passed in then simply return the first route
        if(typeof resourceName === "undefined" | resourceName === null) {
            
            for (var i in routeCollection) {
                if (routeCollection.hasOwnProperty(i) && typeof(i) !== 'function') {
                    return routeCollection[i];
                }
            }
        }
        
        action = (typeof action === "undefined" | action === null) ? "" : action;
        
        route = routeCollection[resourceName];
        
        if (action != "") {
            if (route.hasOwnProperty("children")) {
                routeCollection = route.children;
                route = routeCollection[action];   
            }
        }
        
        return route;
    }
    /*
     *  Return the DSP associated with a particular path.
     */
//    getDspByPath: function (pagePath) {
//        "use strict";
//        var menuItem = this.getMenuItemByPath(pagePath);
//
//        return menuItem.dsp;
//    },

    /*
     *  Return the DSP instance name associated with a
     *  particular path. If no instance name is specified
     *  then the DSP name is returned.
     */
//    getInstanceNameByPath: function (pagePath) {
//        "use strict";
//        var menuItem = this.getMenuItemByPath(pagePath),
//            dsp = menuItem.dsp;
//        if (typeof menuItem.instanceName === "undefined") {
//            return dsp;
//        } else {
//            return menuItem.instanceName;
//        }
//    },

    /*
     *  Given a menuItem return its instance name
     */
//    getInstanceName: function (menuItem) {
//        "use strict";
//        if (typeof menuItem.instanceName === "undefined") {
//            return menuItem.dsp;
//        } else {
//            return menuItem.instanceName;
//        }
//    },
/*
    getMenuItemByInstanceName: function (instanceName, rootMenuMap) {
        "use strict";
        //If rootMenuItem is set then start looking there, otherwise use this.menuMap
        var menuMap = (typeof rootMenuMap === "undefined") ? this.menuMap : rootMenuMap,
            key,
            menuItem,
            currentInstanceName,
            childMenuItem;

        for (key in menuMap) {
            if (menuMap.hasOwnProperty(key)) {
                menuItem = menuMap[key];
                currentInstanceName = this.getInstanceName(menuItem);

                if (currentInstanceName === instanceName) {
                    //Found it, return out
                    return menuItem;
                }

                //If this menu item has children then call getMenuItemByInstanceName on them recursively
                if (menuItem.children) {
                    childMenuItem = this.getMenuItemByInstanceName(instanceName, menuItem.children);
                    if (childMenuItem) {
                        return childMenuItem;
                    }
                }
            }
        }

        //Didn't find a menuItem matching this instance name
        return;

    },
*/
    /*
     *  Returns true if menuItem is in the root
     */
/*    isRootItem: function (menuItem) {
        "use strict";

        var instanceName = this.getInstanceName(menuItem),
            menuMap = this.menuMap,
            key,
            currentMenuItem,
            currentInstanceName;

        for (key in menuMap) {
            if (menuMap.hasOwnProperty(key)) {

                currentMenuItem = menuMap[key];
                currentInstanceName = this.getInstanceName(currentMenuItem);

                if (currentInstanceName === instanceName) {
                    //Found it, return out
                    return true;
                }
            }
        }

        //If we've looped over the root level and not found the menuItem then this isn't a root item
        return false;
    }
*/
};