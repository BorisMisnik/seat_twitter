module.exports = function(grunt){
	grunt.initConfig({
		concat : {
			build : {
				src:  'public/js/*.js',
        		dest: 'public/js/build/scripts.js'
			}
		},
		uglify: {
		    build: {
		     	src: ['public/js/build/scripts.js'],
        		dest: 'assets/js/build/scripts.js'
		    }
 		},
		less : {
			options : {
				paths: './public/css/*.less',
				yuicompress: true
			},
			src : {
				expand: true,
				flatten : true,
				src : ['./public/css/*.less'],
				dest : './assets/css/',
				ext : '.css' 
			}
		},
		watch : {
			style : {
				files : './public/css/*.less',
				tasks : 'less'
			},
			js: {
		        files: '<%= concat.build.src %>',
		        tasks: ['concat', 'uglify']
      		}
		}
	});

	// load grunt npm package 
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
 	grunt.loadNpmTasks('grunt-contrib-watch');

	// register task
	grunt.registerTask('default', ['watch']);
	grunt.registerTask('production', ['concat', 'uglify', 'less']);
}