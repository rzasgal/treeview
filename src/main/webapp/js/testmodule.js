/**
 * Created by pc on 30.12.2014.
 */
angular.module('testmodule', ['treemodule']).controller('testcontroller', function($scope){
    $scope.dataSource = [{
        name: 'test1',
        childs: [{name: 'test3',
                    childs: [{name: 'test5'},
                             {name: 'test6'}]},
                 {name: 'test2'}]
    }];
    $scope.dataTarget =[];
})