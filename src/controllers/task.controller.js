import Task from "../models/Task.js";

const allowed = ['Pendiente', 'En Progreso', 'Completada'];

export async function list(req, res) {
    const items = await Task.find({user: req.userId, deleted: false}).sort({createdAt: -1});
    res.json({items});
}

export async function create(req, res) {
    const {title, description = '', status = 'Pendiente', clienteId} = req.body;
    if(!title) return res.status(400).json({message: 'El título es requerido'});

    const task = await Task.create({
        user: req.userId,
        title,
        description,
        status: allowed.includes(status) ? status : 'Pendiente',
        clienteId
    });
    res.status(201).json({task});
}

export async function update(req, res) {
    const {id} = req.params;
    const {title, description, status} = req.body;

    if (status && !allowed.includes(status))
        return res.status(400).json({message: 'Estado inválido'});

    const task = await Task.findOneAndUpdate(
        {_id: id, user: req.userId},
        {title, description, status},
        {new: true}
    );
    if(!task) return res.status(404).json({message: 'Tarea no encontrada'});
    res.json({task});
}

export async function remove(req, res) {
    const {id} = req.params;
    
    const task = await Task.findOneAndUpdate(
        {_id: id, user: req.userId},
        {deleted: true},
        {new: true}
    );
    if(!task) return res.status(404).json({message: 'Tarea no encontrada'});
    res.json({ok: true});
}

/** ENDPOINT PARA SINCRONIZACION OFFLINE: CREAR/ACTUALIZAR POR CLIENTE Y DEVOLVER EL MAPEO */
export async function bulksync(req, res) {
    const {tasks} = req.body;
    const mapping = [];

    for(const item of tasks){
        if (!item.clienteId || !item.title) continue;

        let doc = await Task.findOne({ user: req.userId, clienteId: item.clienteId });
        if (!doc){
            doc = await Task.create({
                user: req.userId,
                title: item.title,
                description: item.description,
                status: allowed.includes(item.status) ? item.status : 'Pendiente',
                clienteId: item.clienteId
            });
        } else {
            doc.title = item.title ?? doc.title;
            doc.description = item.description ?? doc.description;
            if(item.status && allowed.includes(item.status)) doc.status = item.status;
            await doc.save();
        }
        mapping.push({clienteId: item.clienteId, serverId: String(doc._id)});
    }
    res.json({mapping});
}