from flask import current_app, request, make_response, render_template, flash, redirect, url_for

from app.forms import ApplicationForm

def register_routes(app):

    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "ok"}

    @app.route("/about", methods=["GET"])
    def about():
        return "Job Tracker Project in Flask"

    @app.route("/info", methods=["GET"])
    def info():
        return {"app": current_app.config["APP_NAME"], "env": current_app.config["ENV_NAME"]}

    @app.route("/applications", methods=["GET", "POST"])
    def applications():
        if request.method == "GET":
            return {"applications": []}, 200

        else: 
            response = make_response({"message": "created"}, 201)
            response.headers["X-App"] = "job-tracker"

            return response
        
    @app.route("/applications/<int:app_id>", methods=["GET"])
    def application_detail(app_id):
            return {"id": app_id, "company": "placeholder", "status": "applied"}
    
    @app.route("/search", methods=["GET"])
    def search():
        company = request.args.get("company", None)
        status = request.args.get("status", "any")

        return {"company": company, "status": status}

    @app.errorhandler(404)
    def page_not_found(error):
        return {"error": "not found"}, 404
    

    apps = [{"company": "TestCompany1", "status": "applied"}]

    @app.route("/applications/view", methods=["GET"])
    def getApplicationView():
        return render_template("applications.html", applications = apps)

    @app.route("/applications/new", methods=["GET", "POST"])
    def new_applications():
        form = ApplicationForm()
        if request.method == "GET":
            return render_template("new_application.html", form = form)

        elif request.method == "POST": 
            if form.validate_on_submit():
                company = form.company.data
                status = form.status.data

                apps.append({"company": company, "status": status})

                flash("Application created!")
                return redirect(url_for("getApplicationView"))
            
            return render_template("new_application.html", form = form)
