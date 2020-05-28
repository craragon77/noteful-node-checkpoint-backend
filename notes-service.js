const NotesService = {
    getAllNotes(knex){
        return knex.select('*').from('notes')
    },
    insertNote(knex, newUser){
        return knex
            .insert(newUser)
            .into('notes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id){
        return knex
            .from('notes')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteNote(knex, id){
        return knex('notes')
            .where({id})
            .delete()
    },
    updateNote(knex, id, newUserFields){
        return knex('notes')
            .where({id})
            .update(newUserFields)
    }
}    

module.exports = NotesService