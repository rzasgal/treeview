/**
 * Created by pc on 30.12.2014.
 */
angular.module('testmodule', ['treemodule']).controller('testcontroller', function ($scope) {
    $scope.dataSource = [{
        id: 1, name: 'test1',
        childs: [{
            id: 2, name: 'test3',
            childs: [{id: 3, name: 'test5'},
                {id: 4, name: 'test6'}]
        },
            {id: 5, name: 'test2'}]
    }];
    $scope.dataTarget = [{id: 2, name: 'test3'}];
})