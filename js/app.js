let app = new Vue({
	data(){
		return {
			// ui - based data
			sidebarVisible: false,
			currentView: 'guides',

			// notes - based data
			notes: JSON.parse(localStorage.getItem('notes')) || [],
			newNote: {
				title: '',
				content: ''
			},
			selectedNoteId: localStorage.getItem('selectedNoteId') || null,
			key: '',

			editMode: false,

			recentNotes: JSON.parse(localStorage.getItem('recent-notes')) || []
		}
	},

	watch: {
		/**
		 *
		 * Saves selected note's id in localStorage whenever it changes
		 *
		 * @param {String} newId 
		 * 
		 * @returns {undefined}
		 */
		selectedNoteId(newId){
			localStorage.setItem('selectedNoteId', newId);
		},

		/**
		 *
		 * Saves recent notes whenever any of the notes changes 
		 *
		 * @returns {undefined}
		 */
		recentNotes: {
			handler: 'saveRecentNotes',
			deep: true
		},

		/**
		 *
		 * Saves all notes whenever any note changes in localStorage whenever it changes
		 *
		  * @returns {undefined}
		 */
		notes: {
			handler: 'saveNotes',
			deep: true
		}
	},

	computed: {
		notesCount(){
			return this.notes.length;
		},

		favoritesCount(){
			return this.notes.filter(note => note.favorite).length;
		},

		selectedNote(){
			return this.notes.find(note => note.id === this.selectedNoteId);
		},

		notePreview(){
			return this.selectedNote ? marked(this.selectedNote.content) : '';
		},

		/**
		 *
		 * Attempts to get all matches of the search key
		 *
		 * @returns {Array} search results
		 */
		matchedResults(){
			return this.notes.filter(note => {
				if(this.key){
					let pattern = new RegExp(this.key, 'i');
					return pattern.test(note.title);
				}

				return false;
			});
		}
	},

	methods: {
		/**
		 *
		 * Adds a new note when editMode property is false
		 * Replaces an old note with its edited equivalent when editMode is true
		 *
		 * @returns {undefined}
		 */
		addNote(){
			if(this.newNote.content){
				if(this.editMode){
					// Getting index of note being edited
					let editedNoteIndex = this.notes.indexOf(this.selectedNote);
					let editedNote = {
						id: this.selectedNote.id,
						title: this.newNote.title || `Note ${editedNoteIndex + 1}`,
						content: this.newNote.content,
						createdAt: new Date(),
						favorite: this.selectedNote.favorite
					};

					// old note with edited content
					this.notes.splice( editedNoteIndex, 1, editedNote);
					this.editMode = false;
					swal('Success', 'Note Edited successfully', 'success');

				} else {
					this.notes.push({
						id: this.uniqueUUID(),
						title: this.newNote.title || `Note ${this.notes.length + 1}`,
						content: this.newNote.content,
						createdAt: new Date(),
						favorite: false
					});
					swal('Success', 'Note Created successfully', 'success');

				}

				this.newNote.title = '';
				this.newNote.content = '';
			}
		},

		/**
		 *
		 * saves all notes to localStorage
		 *
		 * @returns {undefined} 
		 */
		saveNotes(){
			localStorage.setItem('notes', JSON.stringify(this.notes));
		},

		/**
		 *
		 * saves all recently accessed notes to localStorage
		 *
		 * @returns {undefined} 
		 */
		saveRecentNotes(){
			localStorage.setItem('recent-notes', JSON.stringify(this.recentNotes));
		},

		/**
		 *
		 * Selects a particular note
		 *
		 * @returns {undefined} 
		 */
		selectNote(note){
			this.selectedNoteId = note.id;
			this.addToRecentlyViewed(note);
			this.key = '';
		},

		/**
		 *
		 * Adds recently accessed note to recents
		 *
		 * @returns {undefined} 
		 */
		addToRecentlyViewed(note){
			let noteIndex = this.recentNotes.indexOf(note);

			// If note already exists in the recents, remove it
			if(noteIndex > -1){
				this.recentNotes.splice(noteIndex, 1);
			}

			this.recentNotes.unshift(note);

			// limiting recent notes to 8
			if(this.recentNotes.length > 8){
				this.recentNotes.pop();
			}
		},

		/**
		 *
		 * Marks a note as favorite
		 *
		 * @returns {undefined} 
		 */
		markAsFavorite(){
			this.selectedNote.favorite = !this.selectedNote.favorite;
		},

		/**
		 *
		 * Sets up editor to edit an existing note
		 *
		 * @returns {undefined} 
		 */
		editNote(){
			this.editMode = true;
			this.newNote.title = this.selectedNote.title;
			this.newNote.content = this.selectedNote.content;
			this.currentView = 'new';
		},

		/**
		 *
		 * Deletes active note
		 *
		 * @returns {undefined} 
		 */
		removeNote(){
			swal({
				title: 'Are you sure',
				text: 'Once deleted, note wont\'t be accessible anymore',
				icon: 'warning',
				buttons: true,
				dangerMode: true
			})
			.then(willDelete => {
				if(willDelete){
					let noteIndex = this.notes.indexOf(this.selectedNote);

					if(noteIndex > -1){
						let prevNote = noteIndex > 0 ? noteIndex - 1 : 0;
						this.notes.splice(noteIndex, 1);

						// remove note from recently viewed
						// noteIndex = this.recentNotes.indexOf(this.selectedNote);
						// this.recentNotes.splice(noteIndex, 1);
						this.selectedNoteId = this.notes[prevNote]?.id;
					}

					swal('Success', 'Note deleted successfully', 'success');
				}
			})
		},

		/**
		 *
		 * Displays a requested view
		 *
		 * @param { String } view #view to display
		 *
		 * @returns {undefined} 
		 */
		showView(view){
			this.currentView = view;
			this.openSidebar(window.innerWidth > 992);
		},

		/**
		 *
		 * Previews a note
		 *
		 * @param { Object } note #note to preview
		 *
		 * @returns {undefined} 
		 */
		previewNote(note = this.selectedNote){
			if(this.notes.indexOf(note) === -1){
				let noteIndex = this.recentNotes.indexOf(note);
				swal('OOOPS!', 'The note you are trying to view has been deleted', 'error').then(value => {
					this.recentNotes.splice(noteIndex, 1);
				})
				
				return;
			}
			// swal({
			// 	title: 'OOOPS!',
			// 	text: 'The note you are trying to view has been deleted',
			// 	icon: 'error'
			// })
			// .then(value => {
			// })

			this.selectNote(note);
			this.currentView = 'preview';
		},

		/**
		 *
		 * Opens sidebar if state is truthy
		 * closes sidebar if state is falsy
		 *
		 * @param { Boolean } state sidebar visibility status
		 *
		 * @returns {undefined} 
		 */
		openSidebar(state = true){
			this.sidebarVisible = state;
		},

		/**
		 *
		 * Generates unique id
		 *
		 * @returns {String} uuid 
		 */
		uniqueUUID(){
			var dt = new Date().getTime();
		    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = (dt + Math.random()*16)%16 | 0;
		        dt = Math.floor(dt/16);
		        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
		    });
		    return uuid;
		}
	},

	created(){
		if(window.innerWidth > 992){
			this.openSidebar();
		}

		window.addEventListener('resize', evt => {
			this.sidebarVisible = evt.target.innerWidth > 992;
		});
	}
});

app.$mount('#notebook');
