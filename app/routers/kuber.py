from http.client import HTTPException
import subprocess
from kubernetes.client import CoreV1Api
from fastapi import APIRouter
from kubernetes import config

router = APIRouter(prefix="/kuber", tags=["kuber"])

NAMESPACE = 'default'

#config.load_incluster_config()

@router.get("/pods")
def list_pods():
    v1 = CoreV1Api()
    pods = v1.list_namespaced_pod(namespace='default')
    return [p.metadata.name for p in pods.items]


@router.post("/deploy")
def install_chart(release_name: str, chart: str):
    try:
        cmd = [
            "helm", "install", release_name, chart,
            "--namespace", NAMESPACE, "--set", "ingress.enabled=false" 
        ]
        
        # Add values file (optional)    
        # if values:
        #     cmd += ["-f", "/tmp/values.yaml"]
        #     # Write values to a temporary file here

        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
         raise HTTPException(500, f"Helm error: {e.stderr}")

