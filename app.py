from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__, static_folder='static')
CORS(app)

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leituras.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelos
class Apartamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(10), unique=True, nullable=False)
    leituras = db.relationship('Leitura', backref='apartamento', lazy=True)

class Leitura(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    apartamento_id = db.Column(db.Integer, db.ForeignKey('apartamento.id'), nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    leitura_atual = db.Column(db.Float, nullable=False)
    leitura_anterior = db.Column(db.Float, nullable=False)
    valor_kg = db.Column(db.Float, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

# Rota para a página inicial
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Servir arquivos estáticos
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Rotas da API
@app.route('/apartamentos', methods=['GET'])
def listar_apartamentos():
    try:
        apartamentos = Apartamento.query.all()
        return jsonify([{'id': a.id, 'numero': a.numero} for a in apartamentos])
    except Exception as e:
        print(f"Erro ao listar apartamentos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/apartamentos', methods=['POST'])
def criar_apartamento():
    try:
        data = request.get_json()
        print(f"Dados recebidos: {data}")
        
        # Verificar se o apartamento já existe
        numero = data['numero']
        apartamento_existente = Apartamento.query.filter_by(numero=numero).first()
        
        if apartamento_existente:
            return jsonify({
                'error': f'Apartamento com número {numero} já está cadastrado'
            }), 409  # Conflict status code
        
        # Criar novo apartamento
        novo_apartamento = Apartamento(numero=numero)
        db.session.add(novo_apartamento)
        db.session.commit()
        print(f"Apartamento cadastrado com sucesso: {novo_apartamento.id} - {novo_apartamento.numero}")
        return jsonify({'id': novo_apartamento.id, 'numero': novo_apartamento.numero}), 201
    except Exception as e:
        print(f"Erro ao cadastrar apartamento: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/leituras', methods=['POST'])
def registrar_leitura():
    try:
        data = request.get_json()
        nova_leitura = Leitura(
            apartamento_id=data['apartamento_id'],
            mes=data['mes'],
            ano=data['ano'],
            leitura_atual=data['leitura_atual'],
            leitura_anterior=data['leitura_anterior'],
            valor_kg=data['valor_kg']
        )
        db.session.add(nova_leitura)
        db.session.commit()
        return jsonify({'id': nova_leitura.id}), 201
    except Exception as e:
        print(f"Erro ao registrar leitura: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/leituras/<int:mes>/<int:ano>', methods=['GET'])
def listar_leituras_mes(mes, ano):
    try:
        leituras = Leitura.query.filter_by(mes=mes, ano=ano).all()
        return jsonify([{
            'id': l.id,
            'apartamento_id': l.apartamento_id,
            'apartamento_numero': l.apartamento.numero,
            'leitura_atual': l.leitura_atual,
            'leitura_anterior': l.leitura_anterior,
            'valor_kg': l.valor_kg,
            'valor_total': calcular_valor_total(l)
        } for l in leituras])
    except Exception as e:
        print(f"Erro ao listar leituras: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calcular_valor_total(leitura):
    consumo_m3 = leitura.leitura_atual - leitura.leitura_anterior
    consumo_kg = consumo_m3 * 2.4
    valor_total = (consumo_kg * leitura.valor_kg) / 1000
    return round(valor_total + 0.5)  # Arredonda para cima

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 