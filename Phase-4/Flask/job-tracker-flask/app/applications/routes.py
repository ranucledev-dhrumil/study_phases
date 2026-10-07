from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.applications.models import Application
from app.errors import NotFoundError

applications_bp = Blueprint("applications", __name__, url_prefix="/api/applications")

@applications_bp.route("", methods=["GET"])
@jwt_required()
def getApplications():
    user_id = int(get_jwt_identity())
    apps = Application.query.filter_by(user_id=user_id).all()
    return jsonify([a.to_dict() for a in apps]), 200

@applications_bp.route("", methods=["POST"])
@jwt_required()
def postApplications():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400
    
    company = data.get("company")
    status = data.get("status", "applied")

    if not isinstance(company, str) or not company.strip():
        return jsonify({"error": "company must be a non-empty string"}), 400

    application = Application(company = company, status = status, user_id = user_id)

    db.session.add(application)
    db.session.commit()
    
    return jsonify(application.to_dict()), 201

@applications_bp.route("/<int:app_id>", methods=["GET"])
@jwt_required()
def getApplicationDetail(app_id):
    user_id = int(get_jwt_identity())
    application = Application.query.get(app_id)

    if not application:
        raise NotFoundError("Application not found")
    if application.user_id != user_id:
        raise NotFoundError("Application not found")
    
    return jsonify(application.to_dict()), 200

@applications_bp.route("/<int:app_id>", methods=["PUT"])
@jwt_required()
def updateApplicationDetail(app_id):
    user_id = int(get_jwt_identity())
    application = Application.query.get(app_id)

    if not application:
        raise NotFoundError("Application not found")
    if application.user_id != user_id:
        raise NotFoundError("Application not found")
    
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    if "company" in data:
        company = data["company"]

        if not isinstance(company, str) or not company.strip():
            return jsonify({"error": "company must be a non-empty string"}), 400
        
        application.company = company

    if "status" in data: 
        application.status = data["status"]

    db.session.commit()

    return jsonify(application.to_dict()), 200
    

@applications_bp.route("/<int:app_id>", methods=["DELETE"])
@jwt_required()
def deleteApplicationDetail(app_id):

    user_id = int(get_jwt_identity())
    application = Application.query.get(app_id)
    
    if not application:
        raise NotFoundError("Application not found")
    if application.user_id != user_id:
        raise NotFoundError("Application not found")

    db.session.delete(application)
    db.session.commit()

    return "", 204